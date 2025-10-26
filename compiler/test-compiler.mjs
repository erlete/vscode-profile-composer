#!/usr/bin/env node

import { ProfileGenerator } from "./lib/profile-generator.mjs";
import path from "path";

/**
 * Test script for the profile compilation system
 */

async function test() {
  console.log("🧪 Testing VS Code Profile Compiler");
  console.log("====================================");

  try {
    const templatesDir = path.join(process.cwd(), "..", "templates");
    const outputDir = path.join(process.cwd(), "test-output");

    const generator = new ProfileGenerator(templatesDir, outputDir);

    // Test 1: Validate templates
    console.log("\n1️⃣ Testing template validation...");
    const isValid = await generator.validateTemplates();
    console.log(
      `   Template validation: ${isValid ? "✅ PASSED" : "❌ FAILED"}`
    );

    // Test 2: Get available templates
    console.log("\n2️⃣ Testing template discovery...");
    const bundles = await generator.resolver.getAvailableTemplates("bundles");
    const frameworks = await generator.resolver.getAvailableTemplates(
      "frameworks"
    );
    const languages = await generator.resolver.getAvailableTemplates(
      "languages"
    );

    console.log(`   Found bundles: ${bundles.join(", ") || "none"}`);
    console.log(`   Found frameworks: ${frameworks.join(", ") || "none"}`);
    console.log(`   Found languages: ${languages.join(", ") || "none"}`);

    // Test 3: Resolve a single template
    if (bundles.length > 0) {
      console.log("\n3️⃣ Testing template resolution...");
      const resolved = await generator.resolver.resolveTemplate(
        "bundles",
        bundles[0],
        "extensions"
      );
      console.log(
        `   Resolved ${bundles[0]} extensions:`,
        resolved.content?.slice(0, 3) || []
      );
    }

    // Test 4: Generate a simple profile
    console.log("\n4️⃣ Testing profile generation...");
    const profile = await generator.generateProfile({
      bundles: bundles.slice(0, 1), // Just first bundle
      frameworks: frameworks.slice(0, 1), // Just first framework
      languages: languages.slice(0, 1), // Just first language
      options: { fetchExtensionInfo: false }, // Skip marketplace fetch for speed
    });

    console.log(`   Generated profile: ${profile.name}`);
    console.log(`   Extensions count: ${profile.extensions?.length || 0}`);
    console.log(
      `   Settings count: ${Object.keys(profile.settings || {}).length}`
    );

    // Test 5: Save the profile
    console.log("\n5️⃣ Testing profile saving...");
    const testProfileName = "test-profile";
    await generator.saveProfiles({ [testProfileName]: profile }, outputDir);
    console.log(`   Profile saved to: ${outputDir}`);

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
test();
