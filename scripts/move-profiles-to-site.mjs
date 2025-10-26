#!/usr/bin/env node

import fs from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";

// move-profiles-to-site.mjs
// Moves *.code-profile and manifest.json from ./compiled -> ./site/public/profiles
// - creates destination dirs if missing
// - clears previous contents in destination
// - preserves relative paths from compiled
// Note: when running this script as part of repository edits, run codacy_cli_analyze as required by your tooling.

const SRC_DIR = path.resolve(process.cwd(), "compiled");
const DEST_DIR = path.resolve(process.cwd(), "site", "public", "profiles");

async function exists(p) {
  try {
    await fs.access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function clearDir(p) {
  // Remove and recreate to ensure a clean directory
  await fs.rm(p, { force: true, recursive: true });
  await ensureDir(p);
}

async function* walk(dir) {
  for (const name of await fs.readdir(dir, { withFileTypes: true })) {
    const res = path.join(dir, name.name);
    if (name.isDirectory()) {
      yield* walk(res);
    } else {
      yield res;
    }
  }
}

async function moveFile(src, dest) {
  await ensureDir(path.dirname(dest));
  try {
    await fs.rename(src, dest);
  } catch (err) {
    // cross-device rename may fail; fall back to copy+unlink
    if (err.code === "EXDEV" || err.code === "EINVAL") {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
    } else {
      throw err;
    }
  }
}

function matches(filePath) {
  const base = path.basename(filePath);
  return base === "manifest.json" || base.endsWith(".code-profile");
}

async function main() {
  if (!(await exists(SRC_DIR))) {
    console.error(`Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  await clearDir(DEST_DIR);

  let moved = 0;
  for await (const filePath of walk(SRC_DIR)) {
    if (!matches(filePath)) continue;
    const rel = path.relative(SRC_DIR, filePath);
    const dest = path.join(DEST_DIR, rel);
    await moveFile(filePath, dest);
    moved++;
  }

  console.log(`Moved ${moved} file(s) from ${SRC_DIR} -> ${DEST_DIR}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
