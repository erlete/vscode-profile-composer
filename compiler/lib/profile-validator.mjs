import Ajv from "ajv";

/**
 * Profile validator - validates generated VS Code profiles
 * Ensures profiles conform to VS Code profile specifications
 */

export class ProfileValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.setupSchemas();
  }

  /**
   * Setup validation schemas for VS Code profiles
   */
  setupSchemas() {
    // VS Code profile schema (simplified)
    const profileSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        $schema: {
          type: "string",
        },
        name: {
          type: "string",
        },
        extensions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              identifier: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  uuid: { type: "string" },
                },
                required: ["id"],
              },
              displayName: { type: "string" },
              version: { type: "string" },
              applicationScoped: { type: "boolean" },
            },
            required: ["identifier"],
          },
        },
        settings: {
          type: "object",
        },
        keybindings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              command: { type: "string" },
              when: { type: "string" },
            },
            required: ["key", "command"],
          },
        },
        tasks: {
          type: "object",
          properties: {
            version: { type: "string" },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  type: { type: "string" },
                  command: { type: "string" },
                },
                required: ["label", "type"],
              },
            },
          },
        },
        snippets: {
          type: "object",
        },
      },
      required: ["name"],
    };

    this.profileValidator = this.ajv.compile(profileSchema);
  }

  /**
   * Validate a VS Code profile
   * @param {Object} profile - the profile to validate
   * @returns {Object} validation result with isValid and errors
   */
  validateProfile(profile) {
    const isValid = this.profileValidator(profile);

    return {
      isValid,
      errors: this.profileValidator.errors || [],
      warnings: this.generateWarnings(profile),
    };
  }

  /**
   * Generate warnings for profile issues that aren't errors
   * @param {Object} profile - the profile to check
   * @returns {Array} array of warning messages
   */
  generateWarnings(profile) {
    const warnings = [];

    // Check for empty extensions
    if (profile.extensions && profile.extensions.length === 0) {
      warnings.push("Profile has no extensions");
    }

    // Check for empty settings
    if (profile.settings && Object.keys(profile.settings).length === 0) {
      warnings.push("Profile has no settings");
    }

    // Check for duplicate extension IDs
    if (profile.extensions && profile.extensions) {
      const extensionIds = profile.extensions.map((ext) => ext.identifier.id);
      const duplicates = extensionIds.filter(
        (id, index) => extensionIds.indexOf(id) !== index
      );
      if (duplicates.length > 0) {
        warnings.push(
          `Duplicate extensions found: ${[...new Set(duplicates)].join(", ")}`
        );
      }
    }

    // Check for invalid extension IDs format
    if (profile.extensions && profile.extensions) {
      for (const extension of profile.extensions) {
        const id = extension.identifier.id;
        if (!id.includes(".") || id.split(".").length !== 2) {
          warnings.push(
            `Invalid extension ID format: ${id} (should be publisher.extension)`
          );
        }
      }
    }

    return warnings;
  }

  /**
   * Validate multiple profiles
   * @param {Object} profiles - map of profile names to profiles
   * @returns {Object} validation results for all profiles
   */
  validateProfiles(profiles) {
    const results = {};

    for (const [profileName, profile] of Object.entries(profiles)) {
      results[profileName] = this.validateProfile(profile);
    }

    return results;
  }

  /**
   * Generate a validation report
   * @param {Object} validationResults - results from validateProfiles
   * @returns {Object} validation report summary
   */
  generateReport(validationResults) {
    const report = {
      totalProfiles: 0,
      validProfiles: 0,
      invalidProfiles: 0,
      totalWarnings: 0,
      totalErrors: 0,
      details: {},
    };

    for (const [profileName, result] of Object.entries(validationResults)) {
      report.totalProfiles++;

      if (result.isValid) {
        report.validProfiles++;
      } else {
        report.invalidProfiles++;
      }

      report.totalWarnings += result.warnings.length;
      report.totalErrors += result.errors.length;

      report.details[profileName] = {
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        errors: result.errors,
        warnings: result.warnings,
      };
    }

    return report;
  }

  /**
   * Print validation report to console
   * @param {Object} report - validation report from generateReport
   */
  printReport(report) {
    console.log("\n📋 Profile Validation Report");
    console.log("===============================");
    console.log(`Total profiles: ${report.totalProfiles}`);
    console.log(`Valid profiles: ${report.validProfiles} ✅`);
    console.log(`Invalid profiles: ${report.invalidProfiles} ❌`);
    console.log(`Total warnings: ${report.totalWarnings} ⚠️`);
    console.log(`Total errors: ${report.totalErrors} 🚫`);

    if (report.invalidProfiles > 0 || report.totalWarnings > 0) {
      console.log("\nDetails:");
      console.log("--------");

      for (const [profileName, details] of Object.entries(report.details)) {
        if (!details.isValid || details.warningCount > 0) {
          console.log(`\n${profileName}:`);

          if (details.errors.length > 0) {
            console.log("  Errors:");
            details.errors.forEach((error) => {
              console.log(`    🚫 ${error.instancePath}: ${error.message}`);
            });
          }

          if (details.warnings.length > 0) {
            console.log("  Warnings:");
            details.warnings.forEach((warning) => {
              console.log(`    ⚠️  ${warning}`);
            });
          }
        }
      }
    }
  }
}

export default ProfileValidator;
