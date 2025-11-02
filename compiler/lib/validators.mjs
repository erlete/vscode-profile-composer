import { execFileSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import Ajv from "ajv";

/**
 * Ensure the current working directory (or provided cwd) is the git repository root.
 * Throws an Error if:
 *  - the cwd is not inside a git repository
 *  - the cwd is inside a repo but not the repository root
 *
 * @param {string} [cwd=process.cwd()] - Directory to validate (defaults to process.cwd()).
 * @returns {true} - returns true when validation passes
 * @throws {Error} - descriptive error when not at repo root or not a git repo
 */
export function validateGitRepository(cwd = process.cwd()) {
  let gitTop;
  try {
    gitTop = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (err) {
    const e = new Error("Not a git repository (git rev-parse failed).");
    e.cause = err;
    throw e;
  }

  const resolvedGitTop = path.resolve(gitTop);
  const resolvedCwd = path.resolve(cwd);

  const isWin = process.platform === "win32";
  const equal = isWin
    ? resolvedGitTop.toLowerCase() === resolvedCwd.toLowerCase()
    : resolvedGitTop === resolvedCwd;

  if (!equal) {
    const e = new Error(
      `Current directory is not the repository root.\nGit root: ${resolvedGitTop}\nCurrent:  ${resolvedCwd}`,
    );
    e.gitRoot = resolvedGitTop;
    e.cwd = resolvedCwd;
    throw e;
  }

  return true;
}

/**
 * Validates the templates directory structure and content.
 * Ensures proper directory structure, required files, and schema compliance.
 *
 * @param {string} [templatesDir] - Path to templates directory (defaults to ./templates)
 * @returns {Promise<boolean>} - Returns true if validation passes
 * @throws {Error} - Descriptive error when validation fails
 */
export async function validateTemplates(templatesDir = null) {
  const templatesPath = templatesDir || path.join(process.cwd(), "templates");
  const requiredTop = new Set(["bundles", "frameworks", "languages"]);

  function fail(msg) {
    const error = new Error(msg);
    throw error;
  }

  async function assertDir(p, msg) {
    const st = await fs.stat(p).catch(() => null);
    if (!st || !st.isDirectory()) fail(msg);
  }

  try {
    await assertDir(
      templatesPath,
      `templates directory not found at ${templatesPath}`,
    );

    const topEntries = await fs.readdir(templatesPath, { withFileTypes: true });

    // Ensure no files at templates root
    const hasFilesAtRoot = topEntries.some((e) => !e.isDirectory());
    if (hasFilesAtRoot)
      fail("templates must contain only directories (no files) at its root");

    const topDirs = topEntries.map((e) => e.name);
    const missing = [...requiredTop].filter((n) => !topDirs.includes(n));
    const extra = topDirs.filter((n) => !requiredTop.has(n));
    if (missing.length || extra.length) {
      const parts = [];
      if (missing.length) parts.push(`missing: ${missing.join(", ")}`);
      if (extra.length) parts.push(`unexpected: ${extra.join(", ")}`);
      fail(
        `templates must contain exactly directories bundles, frameworks and languages - ${parts.join(
          "; ",
        )}`,
      );
    }

    // For each of the three top-level dirs
    for (const topName of requiredTop) {
      const topPath = path.join(templatesPath, topName);
      const children = await fs.readdir(topPath, { withFileTypes: true });

      // They can ONLY contain directories (names arbitrary)
      const filesInTop = children
        .filter((e) => !e.isDirectory())
        .map((e) => e.name);
      if (filesInTop.length) {
        fail(
          `"${topName}" must contain only directories. Found file(s): ${filesInTop.join(
            ", ",
          )}`,
        );
      }

      // For each subdir inside topName
      for (const dirEnt of children) {
        const subName = dirEnt.name;
        const subPath = path.join(topPath, subName);
        await assertDir(subPath, `expected directory ${subPath}`);

        const subItems = await fs.readdir(subPath, { withFileTypes: true });
        const subNames = subItems.map((i) => i.name);

        const allowedFiles = new Set([
          "extensions.json",
          "settings.json",
          "keybindings.json",
          "tasks.json",
          "snippets.json",
          "globalState.json",
        ]);
        const extraFiles = subNames.filter((n) => !allowedFiles.has(n));
        const presentAllowedFiles = subNames.filter((n) => allowedFiles.has(n));

        // If no allowed files are found, error out:
        if (presentAllowedFiles.length === 0) {
          let rel = path.relative(process.cwd(), subPath);
          if (!rel || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
            rel = `.${path.sep}${rel}`;
          }
          fail(
            `[ERROR] Template at ${rel} must contain at least one of the required files: ${[
              ...allowedFiles,
            ].join(", ")}.`,
          );
        }

        // Ensure those two are files (not directories):
        for (const requiredFile of presentAllowedFiles) {
          const filePath = path.join(subPath, requiredFile);
          const st = await fs.stat(filePath).catch(() => null);
          if (!st || !st.isFile())
            fail(`[ERROR] ${filePath} is missing or not a file`);
        }

        // If unallowed files are found, error out:
        if (extraFiles.length) {
          let rel = path.relative(process.cwd(), subPath);
          if (!rel || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
            rel = `.${path.sep}${rel}`;
          }
          fail(
            `[ERROR] Template at ${rel} contains unexpected files: ${extraFiles.join(
              ", ",
            )}. Allowed files are: ${[...allowedFiles].join(", ")}.`,
          );
        }

        // Validate extensions.json schema if it exists:
        if (!subNames.includes("extensions.json")) continue;
        const extensionsPath = path.join(subPath, "extensions.json");
        try {
          const extensions = JSON.parse(await fs.readFile(extensionsPath));

          if (
            !extensions["$schema"] ||
            extensions["$schema"] !==
              "../../../compiler/config/extensions.schema.json"
          ) {
            fail(
              `[ERROR] Template extensions file at ${path.relative(
                process.cwd(),
                extensionsPath,
              )} has got an incorrect format.`,
            );
          }

          // Validate against the JSON Schema referenced by "$schema"
          if (
            !extensions["$schema"] ||
            typeof extensions["$schema"] !== "string"
          ) {
            fail(
              `[ERROR] Template extensions file at ${path.relative(
                process.cwd(),
                extensionsPath,
              )} must contain a "$schema" string property.`,
            );
          }

          const schemaRef = extensions["$schema"];
          let schema;

          try {
            if (/^https?:\/\//.test(schemaRef)) {
              // Fetch remote schema
              const res = await fetch(schemaRef);
              if (!res.ok)
                throw new Error(`Failed to fetch schema: ${res.status}`);
              schema = await res.json();
            } else {
              // Resolve schema path relative to the template directory (subPath)
              const schemaPath = path.isAbsolute(schemaRef)
                ? schemaRef
                : path.resolve(subPath, schemaRef);
              const schemaText = await fs
                .readFile(schemaPath, "utf8")
                .catch(() => null);
              if (!schemaText)
                throw new Error(`Schema not found at ${schemaPath}`);
              schema = JSON.parse(schemaText);
            }
          } catch (err) {
            fail(
              `[ERROR] Could not load schema ${schemaRef} for ${path.relative(
                process.cwd(),
                extensionsPath,
              )}: ${err && err.message ? err.message : String(err)}`,
            );
          }

          // Perform AJV validation:
          try {
            const ajv = new Ajv({ allErrors: true, strict: false });
            const validate = ajv.compile(schema);
            const valid = validate(extensions);
            if (!valid) {
              const errors = (validate.errors || [])
                .map((e) => {
                  const inst = e.instancePath || e.dataPath || "";
                  return `${inst} ${e.message || JSON.stringify(e)}`;
                })
                .join("\n  - ");
              fail(
                `[ERROR] Template extensions file at ${path.relative(
                  process.cwd(),
                  extensionsPath,
                )} does not conform to schema ${schemaRef}:\n  - ${errors}`,
              );
            }
          } catch (err) {
            fail(
              `[ERROR] Failed to validate ${path.relative(
                process.cwd(),
                extensionsPath,
              )} against schema ${schemaRef}: ${
                err && err.message ? err.message : String(err)
              }`,
            );
          }
        } catch {
          fail(
            `[ERROR] Template extensions file at ${path.relative(
              process.cwd(),
              extensionsPath,
            )} is malformed.`,
          );
        }
      }
    }

    return true;
  } catch (err) {
    const error = new Error(
      `Validation error: ${err && err.message ? err.message : String(err)}`,
    );
    error.cause = err;
    throw error;
  }
}
