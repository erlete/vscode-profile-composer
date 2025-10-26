import { TemplateResolver } from "./template-resolver.mjs";
import { ProfileCompiler } from "./profile-compiler.mjs";
import { validateGitRepository } from "./validate-git-repository.mjs";
import { promises as fs } from "fs";
import path from "path";

/**
 * Main profile compilation orchestrator
 * Handles the complete process of generating VS Code profiles from templates
 */

export class ProfileGenerator {
  constructor(templatesDir = null, outputDir = null) {
    this.templatesDir = templatesDir || path.join(process.cwd(), "templates");
    this.outputDir = outputDir || path.join(process.cwd(), "compiled");
    this.resolver = new TemplateResolver(this.templatesDir);
    this.compiler = new ProfileCompiler();
  }

  /**
   * Generate a profile for specific template combinations
   * @param {Object} config - generation configuration
   * @param {string[]} config.bundles - array of bundle names to include
   * @param {string[]} config.frameworks - array of framework names to include
   * @param {string[]} config.languages - array of language names to include
   * @param {Object} config.options - compilation options
   * @returns {Promise<Object>} generated VS Code profile
   */
  async generateProfile(config) {
    const {
      bundles = [],
      frameworks = [],
      languages = [],
      options = {},
    } = config;

    // Component types to process
    const componentTypes = [
      "extensions",
      "settings",
      "keybindings",
      "tasks",
      "snippets",
      "globalState",
    ];
    const resolvedTemplates = {};

    // Process each component type
    for (const componentType of componentTypes) {
      const mergedContent =
        componentType === "settings" || componentType === "globalState"
          ? {}
          : [];

      // Process bundles
      for (const bundleName of bundles) {
        const template = await this.resolver.resolveTemplate(
          "bundles",
          bundleName,
          componentType
        );
        if (template.content) {
          if (componentType === "settings" || componentType === "globalState") {
            Object.assign(mergedContent, template.content);
          } else {
            mergedContent.push(
              ...(Array.isArray(template.content)
                ? template.content
                : [template.content])
            );
          }
        }
      }

      // Process frameworks
      for (const frameworkName of frameworks) {
        const template = await this.resolver.resolveTemplate(
          "frameworks",
          frameworkName,
          componentType
        );
        if (template.content) {
          if (componentType === "settings" || componentType === "globalState") {
            Object.assign(mergedContent, template.content);
          } else {
            mergedContent.push(
              ...(Array.isArray(template.content)
                ? template.content
                : [template.content])
            );
          }
        }
      }

      // Process languages
      for (const languageName of languages) {
        const template = await this.resolver.resolveTemplate(
          "languages",
          languageName,
          componentType
        );
        if (template.content) {
          if (componentType === "settings" || componentType === "globalState") {
            Object.assign(mergedContent, template.content);
          } else {
            mergedContent.push(
              ...(Array.isArray(template.content)
                ? template.content
                : [template.content])
            );
          }
        }
      }

      // Remove duplicates for array-based content
      if (Array.isArray(mergedContent)) {
        resolvedTemplates[componentType] = {
          content: [...new Set(mergedContent.flat())],
        };
      } else {
        resolvedTemplates[componentType] = {
          content: mergedContent,
        };
      }
    }

    // Generate profile name
    const profileName = this.generateProfileName(
      bundles,
      frameworks,
      languages
    );

    // Compile the profile
    return await this.compiler.compileProfile(resolvedTemplates, {
      name: `VSCode Profile Composer (${profileName})`,
      ...options,
    });
  }

  /**
   * Generate profiles for all possible combinations
   * @param {Object} options - generation options
   * @returns {Promise<Object>} map of profile names to profiles
   */
  async generateAllProfiles(options = {}) {
    const availableBundles = await this.resolver.getAvailableTemplates(
      "bundles"
    );
    const availableFrameworks = await this.resolver.getAvailableTemplates(
      "frameworks"
    );
    const availableLanguages = await this.resolver.getAvailableTemplates(
      "languages"
    );

    console.log(`Found templates:`);
    console.log(`  Bundles: ${availableBundles.join(", ") || "none"}`);
    console.log(`  Frameworks: ${availableFrameworks.join(", ") || "none"}`);
    console.log(`  Languages: ${availableLanguages.join(", ") || "none"}`);

    const profiles = {};
    const combinations = this.generateCombinations(
      availableBundles,
      availableFrameworks,
      availableLanguages
    );

    console.log(`Generating ${combinations.length} profile combinations...`);

    for (const combination of combinations) {
      try {
        const profile = await this.generateProfile({
          bundles: combination.bundles,
          frameworks: combination.frameworks,
          languages: combination.languages,
          options,
        });

        const profileKey = this.generateProfileName(
          combination.bundles,
          combination.frameworks,
          combination.languages
        );
        profiles[profileKey] = profile;

        console.log(`✓ Generated profile: ${profileKey}`);
      } catch (error) {
        const profileKey = this.generateProfileName(
          combination.bundles,
          combination.frameworks,
          combination.languages
        );
        console.error(
          `✗ Failed to generate profile ${profileKey}: ${error.message}`
        );
      }
    }

    return profiles;
  }

  /**
   * Save profiles to disk
   * @param {Object} profiles - map of profile names to profiles
   * @param {string} outputDir - output directory (optional)
   * @returns {Promise<void>}
   */
  async saveProfiles(profiles, outputDir = null) {
    const targetDir = outputDir || this.outputDir;

    // Ensure output directory exists
    await fs.mkdir(targetDir, { recursive: true });

    const manifest = {
      generated: new Date().toISOString(),
      version: "1.0.0",
      totalProfiles: Object.keys(profiles).length,
      profiles: [],
    };

    for (const [profileName, profile] of Object.entries(profiles)) {
      const filename = `${profileName.replace(
        /[^a-zA-Z0-9-_]/g,
        ","
      )}.code-profile`;
      const filepath = path.join(targetDir, filename);

      // Write profile file
      await fs.writeFile(filepath, JSON.stringify(profile, null, 2));
      console.log(`Saved profile: ${filepath}`);

      // Get file stats for manifest
      const stats = await fs.stat(filepath);

      // Add to manifest
      manifest.profiles.push({
        name: profileName,
        filename: filename,
        displayName: profile.name || profileName,
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        extensionCount: profile.extensions?.length || 0,
        settingCount: Object.keys(profile.settings || {}).length,
        components: {
          hasExtensions: !!profile.extensions?.length,
          hasSettings: !!Object.keys(profile.settings || {}).length,
          hasKeybindings: !!profile.keybindings?.length,
          hasTasks: !!(Object.keys(profile.tasks || {}).length > 1), // More than just version
          hasSnippets: !!Object.keys(profile.snippets || {}).length,
        },
      });
    }

    // Save manifest file
    const manifestPath = path.join(targetDir, "manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Generated manifest: ${manifestPath}`);
  }

  /**
   * Generate all possible combinations of templates
   * @param {string[]} bundles - available bundles
   * @param {string[]} frameworks - available frameworks
   * @param {string[]} languages - available languages
   * @returns {Array} array of combination objects
   */
  generateCombinations(bundles, frameworks, languages) {
    const combinations = [];

    // Generate all non-empty subsets
    const bundleCombos = this.generateSubsets(bundles);
    const frameworkCombos = this.generateSubsets(frameworks);
    const languageCombos = this.generateSubsets(languages);

    for (const bundleCombo of bundleCombos) {
      for (const frameworkCombo of frameworkCombos) {
        for (const languageCombo of languageCombos) {
          // Only include combinations that have at least one template
          if (
            bundleCombo.length > 0 ||
            frameworkCombo.length > 0 ||
            languageCombo.length > 0
          ) {
            combinations.push({
              bundles: bundleCombo,
              frameworks: frameworkCombo,
              languages: languageCombo,
            });
          }
        }
      }
    }

    return combinations;
  }

  /**
   * Generate all subsets of an array (including empty set)
   * @param {Array} arr - input array
   * @returns {Array} array of all subsets
   */
  generateSubsets(arr) {
    const result = [[]]; // Start with empty set

    for (const item of arr) {
      const newSubsets = result.map((subset) => [...subset, item]);
      result.push(...newSubsets);
    }

    return result;
  }

  /**
   * Generate a profile name from template combinations
   * @param {string[]} bundles - bundle names
   * @param {string[]} frameworks - framework names
   * @param {string[]} languages - language names
   * @returns {string} profile name
   */
  generateProfileName(bundles, frameworks, languages) {
    const parts = []; // string[]

    if (bundles.length > 0) parts.push(bundles.join(","));
    if (frameworks.length > 0) parts.push(frameworks.join(","));
    if (languages.length > 0) parts.push(languages.join(","));

    const flatParts = parts.map((part) => part.split(",")).flat();
    const dedupedParts = [...new Set(flatParts)];
    const sortedJoinedByCommas = dedupedParts.sort().join(",");

    return sortedJoinedByCommas || "empty";
  }

  /**
   * Validate templates before compilation
   * @returns {Promise<boolean>} true if validation passes
   */
  async validateTemplates() {
    try {
      validateGitRepository();
      // Additional validation logic can be added here
      return true;
    } catch (error) {
      console.error(`Template validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.resolver.clearCache();
    this.compiler.clearCache();
  }
}

export default ProfileGenerator;
