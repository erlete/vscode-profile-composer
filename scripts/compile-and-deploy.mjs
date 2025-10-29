#!/usr/bin/env node

import path from "path";
import { validateGitRepository } from "../compiler/lib/validators.mjs";
import { execSync } from "child_process";

async function compileAndBuildSite() {
  validateGitRepository();

  const siteDir = path.join(process.cwd(), "site");

  console.log("Running compiler...");
  execSync("node compiler", { stdio: "inherit" });

  console.log("Copying profiles to site...");
  execSync("node scripts/copy-profiles-to-site.mjs", { stdio: "inherit" });

  console.log("Building site...");
  execSync("npm run build", { cwd: siteDir, stdio: "inherit" });

  console.log("Copying static assets...");
  execSync("node scripts/copy-static-assets.mjs", {
    cwd: siteDir,
    stdio: "inherit",
  });

  console.log("Compilation and site build complete!");
}

compileAndBuildSite();
