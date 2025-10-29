#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { validateGitRepository } from "../compiler/lib/validators.mjs";

/**
 * Manifest reader utility - displays profile generation information
 */

async function readManifest(manifestPath = null) {
  const defaultPath = path.join(process.cwd(), "compiled", "manifest.json");
  const filePath = manifestPath || defaultPath;

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const manifest = JSON.parse(content);

    console.log("📋 VS Code Profiles Manifest");
    console.log("=============================");
    console.log(`Generated: ${new Date(manifest.generated).toLocaleString()}`);
    console.log(`Version: ${manifest.version}`);
    console.log(`Total Profiles: ${manifest.totalProfiles}`);
    console.log("");

    if (manifest.profiles && manifest.profiles.length > 0) {
      console.log("📦 Profile Details:");
      console.log("-------------------");

      for (const profile of manifest.profiles) {
        console.log(`\n🔸 ${profile.name}`);
        console.log(`   File: ${profile.filename}`);
        console.log(`   Display Name: ${profile.displayName}`);
        console.log(`   Size: ${formatFileSize(profile.size)}`);
        console.log(`   Extensions: ${profile.extensionCount}`);
        console.log(`   Settings: ${profile.settingCount}`);
        console.log(
          `   Created: ${new Date(profile.created).toLocaleString()}`
        );
        console.log(
          `   Modified: ${new Date(profile.modified).toLocaleString()}`
        );

        const components = [];
        if (profile.components.hasExtensions) components.push("Extensions");
        if (profile.components.hasSettings) components.push("Settings");
        if (profile.components.hasKeybindings) components.push("Keybindings");
        if (profile.components.hasTasks) components.push("Tasks");
        if (profile.components.hasSnippets) components.push("Snippets");

        console.log(`   Components: ${components.join(", ") || "None"}`);
      }

      console.log("\n📊 Summary Statistics:");
      console.log("----------------------");
      const totalExtensions = manifest.profiles.reduce(
        (sum, p) => sum + p.extensionCount,
        0
      );
      const totalSettings = manifest.profiles.reduce(
        (sum, p) => sum + p.settingCount,
        0
      );
      const totalSize = manifest.profiles.reduce((sum, p) => sum + p.size, 0);
      const avgExtensions = Math.round(
        totalExtensions / manifest.profiles.length
      );

      console.log(`Total Extensions: ${totalExtensions}`);
      console.log(`Total Settings: ${totalSettings}`);
      console.log(`Total Size: ${formatFileSize(totalSize)}`);
      console.log(`Average Extensions per Profile: ${avgExtensions}`);

      const componentsCount = {
        extensions: manifest.profiles.filter((p) => p.components.hasExtensions)
          .length,
        settings: manifest.profiles.filter((p) => p.components.hasSettings)
          .length,
        keybindings: manifest.profiles.filter(
          (p) => p.components.hasKeybindings
        ).length,
        tasks: manifest.profiles.filter((p) => p.components.hasTasks).length,
        snippets: manifest.profiles.filter((p) => p.components.hasSnippets)
          .length,
      };

      console.log(`Profiles with Extensions: ${componentsCount.extensions}`);
      console.log(`Profiles with Settings: ${componentsCount.settings}`);
      console.log(`Profiles with Keybindings: ${componentsCount.keybindings}`);
      console.log(`Profiles with Tasks: ${componentsCount.tasks}`);
      console.log(`Profiles with Snippets: ${componentsCount.snippets}`);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`❌ Manifest file not found: ${filePath}`);
      console.error(
        "   Run the profile compiler first to generate profiles and manifest."
      );
    } else {
      console.error(`❌ Error reading manifest: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - file size in bytes
 * @returns {string} formatted size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Parse command line arguments
const manifestPath = process.argv[2];

// Run the manifest reader
validateGitRepository();
readManifest(manifestPath);
