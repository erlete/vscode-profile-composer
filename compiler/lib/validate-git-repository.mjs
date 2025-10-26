import { execFileSync } from "child_process";
import path from "path";

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
      `Current directory is not the repository root.\nGit root: ${resolvedGitTop}\nCurrent:  ${resolvedCwd}`
    );
    e.gitRoot = resolvedGitTop;
    e.cwd = resolvedCwd;
    throw e;
  }

  return true;
}
