#!/usr/bin/env node

import { ProfileGenerator } from "./profile-generator.mjs";
import path from "path";

/**
 * Main entry point for profile compilation
 * Usage: node compile-profiles.mjs [options]
 */

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  console.log("🚀 VS Code Profile Compiler");
  console.log("============================");

  try {
    const generator = new ProfileGenerator(
      options.templatesDir,
      options.outputDir
    );

    // Validate templates first
    console.log("📋 Validating templates...");
    const isValid = await generator.validateTemplates();
    if (!isValid) {
      console.error("❌ Template validation failed");
      process.exit(1);
    }
    console.log("✅ Templates validated successfully");

    if (options.specific) {
      // Generate specific profile
      console.log(`📦 Generating specific profile...`);
      const profile = await generator.generateProfile(options.specific);
      const profileName = generator.generateProfileName(
        options.specific.bundles || [],
        options.specific.frameworks || [],
        options.specific.languages || []
      );

      await generator.saveProfiles(
        { [profileName]: profile },
        options.outputDir
      );
      console.log(`✅ Generated profile: ${profileName}`);
    } else {
      // Generate all possible profiles
      console.log("📦 Generating all possible profiles...");
      const profiles = await generator.generateAllProfiles({
        fetchExtensionInfo: !options.noFetch,
      });

      console.log(`💾 Saving ${Object.keys(profiles).length} profiles...`);
      await generator.saveProfiles(profiles, options.outputDir);

      console.log(
        `✅ Successfully generated ${Object.keys(profiles).length} profiles`
      );
    }

    console.log(
      `📁 Output directory: ${
        options.outputDir || path.join(process.cwd(), "compiled")
      }`
    );
  } catch (error) {
    console.error(`❌ Compilation failed: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 * @param {string[]} args - command line arguments
 * @returns {Object} parsed options
 */
function parseArgs(args) {
  const options = {
    templatesDir: null,
    outputDir: null,
    noFetch: false,
    verbose: false,
    specific: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--templates-dir":
      case "-t":
        options.templatesDir = args[++i];
        break;

      case "--output-dir":
      case "-o":
        options.outputDir = args[++i];
        break;

      case "--no-fetch":
        options.noFetch = true;
        break;

      case "--verbose":
      case "-v":
        options.verbose = true;
        break;

      case "--bundles":
        if (!options.specific) options.specific = {};
        options.specific.bundles = args[++i].split(",");
        break;

      case "--frameworks":
        if (!options.specific) options.specific = {};
        options.specific.frameworks = args[++i].split(",");
        break;

      case "--languages":
        if (!options.specific) options.specific = {};
        options.specific.languages = args[++i].split(",");
        break;

      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;

      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
VS Code Profile Compiler

Usage: node compile-profiles.mjs [options]

Options:
  -t, --templates-dir <dir>     Templates directory (default: ./templates)
  -o, --output-dir <dir>        Output directory (default: ./compiled)
  --no-fetch                    Skip fetching extension information from marketplace
  -v, --verbose                 Enable verbose output
  --bundles <list>              Generate specific profile with comma-separated bundles
  --frameworks <list>           Generate specific profile with comma-separated frameworks  
  --languages <list>            Generate specific profile with comma-separated languages
  -h, --help                    Show this help message

Examples:
  node compile-profiles.mjs                                    # Generate all profiles
  node compile-profiles.mjs --bundles ai,ui --languages js    # Generate specific profile
  node compile-profiles.mjs --no-fetch -o ./output            # Fast generation without extension info
`);
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { main as compileProfiles };
