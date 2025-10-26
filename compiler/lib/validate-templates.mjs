import { validateGitRepository } from "./validate-git-repository.mjs";
import { promises as fs, readFile } from "fs";
import path from "path";
import Ajv from "ajv";

validateGitRepository();

const templatesDir = path.join(process.cwd(), "templates");
const requiredTop = new Set(["bundles", "frameworks", "languages"]);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function assertDir(p, msg) {
  const st = await fs.stat(p).catch(() => null);
  if (!st || !st.isDirectory()) fail(msg);
}

try {
  await assertDir(
    templatesDir,
    `templates directory not found at ${templatesDir}`
  );

  const topEntries = await fs.readdir(templatesDir, { withFileTypes: true });

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
        "; "
      )}`
    );
  }

  // For each of the three top-level dirs
  for (const topName of requiredTop) {
    const topPath = path.join(templatesDir, topName);
    const children = await fs.readdir(topPath, { withFileTypes: true });

    // They can ONLY contain directories (names arbitrary)
    const filesInTop = children
      .filter((e) => !e.isDirectory())
      .map((e) => e.name);
    if (filesInTop.length) {
      fail(
        `"${topName}" must contain only directories. Found file(s): ${filesInTop.join(
          ", "
        )}`
      );
    }

    // For each subdir inside topName
    for (const dirEnt of children) {
      const subName = dirEnt.name;
      const subPath = path.join(topPath, subName);
      await assertDir(subPath, `expected directory ${subPath}`);

      const subItems = await fs.readdir(subPath, { withFileTypes: true });
      const subNames = subItems.map((i) => i.name);

      // Must contain ONLY settings.json and extensions.json
      const requiredFiles = new Set(["settings.json", "extensions.json"]);
      const missingFiles = [...requiredFiles].filter(
        (f) => !subNames.includes(f)
      );
      const extraFiles = subNames.filter((n) => !requiredFiles.has(n));
      const target = path.join(templatesDir, topName, subName);

      if (missingFiles.length || extraFiles.length) {
        const parts = [];
        if (missingFiles.length)
          parts.push(`Missing files: ${missingFiles.join(", ")}`);
        if (extraFiles.length)
          parts.push(`Unexpected files: ${extraFiles.join(", ")}`);
        let rel = path.relative(process.cwd(), target);
        if (!rel || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
          rel = `.${path.sep}${rel}`;
        }
        fail(
          `[ERROR] Template at ${rel} expected only settings.json and extensions.json.\n  - ${parts.join(
            ".\n  - "
          )}`
        );
      }

      // Validate extensions.json schema:
      const extensionsPath = path.join(target, "extensions.json");
      try {
        const extensions = JSON.parse(await fs.readFile(extensionsPath));

        if (
          !extensions["$schema"] ||
          extensions["$schema"] !==
            "../../../core/schemas/extensions.schema.json"
        ) {
          fail(
            `[ERROR] Template extensions file at ${path.relative(
              process.cwd(),
              extensionsPath
            )} has got an incorrect format.`
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
              extensionsPath
            )} must contain a "$schema" string property.`
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
            // Resolve schema path relative to the template directory (target)
            const schemaPath = path.isAbsolute(schemaRef)
              ? schemaRef
              : path.resolve(target, schemaRef);
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
              extensionsPath
            )}: ${err && err.message ? err.message : String(err)}`
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
                extensionsPath
              )} does not conform to schema ${schemaRef}:\n  - ${errors}`
            );
          }
        } catch (err) {
          fail(
            `[ERROR] Failed to validate ${path.relative(
              process.cwd(),
              extensionsPath
            )} against schema ${schemaRef}: ${
              err && err.message ? err.message : String(err)
            }`
          );
        }
      } catch {
        fail(
          `[ERROR] Template extensions file at ${path.relative(
            process.cwd(),
            extensionsPath
          )} is malformed.`
        );
      }

      // Ensure those two are files (not directories)
      for (const requiredFile of requiredFiles) {
        const filePath = path.join(subPath, requiredFile);
        const st = await fs.stat(filePath).catch(() => null);
        if (!st || !st.isFile()) fail(`${filePath} is missing or not a file`);
      }
    }
  }

  console.log(`[INFO] Template validation passed.`);
} catch (err) {
  fail(`Validation error: ${err && err.message ? err.message : String(err)}`);
}
