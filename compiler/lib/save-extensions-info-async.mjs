import https from "https";
import fs from "fs";
import path from "path";

async function getExtensionInfo(extensionId) {
  const postData = JSON.stringify({
    filters: [
      {
        criteria: [
          {
            filterType: 7,
            value: extensionId,
          },
        ],
      },
    ],
    flags: 914,
  });

  const options = {
    hostname: "marketplace.visualstudio.com",
    path: "/_apis/public/gallery/extensionquery",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json;api-version=3.0-preview.1",
      "Content-Length": postData.length,
      "User-Agent": "VSCode-Extension-Resolver/1.0.0",
    },
  };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      req.destroy();
      console.warn(`Timeout for ${extensionId}`);
      resolve(null);
    }, 10000); // 10 second timeout

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data);
          const ext = response.results[0]?.extensions[0];
          if (ext) {
            resolve({
              identifier: {
                id: `${ext.publisher.publisherName}.${ext.extensionName}`,
                uuid: ext.extensionId,
              },
              displayName: ext.displayName,
              version: ext.versions[0].version,
              description: ext.shortDescription,
              publisher: ext.publisher.publisherName,
              applicationScoped: false, // Default value, matches VS Code profile format
            });
          } else {
            console.warn(`Extension not found: ${extensionId}`);
            resolve(null);
          }
        } catch (error) {
          console.warn(
            `Error parsing response for ${extensionId}:`,
            error.message
          );
          resolve(null);
        }
      });
    });

    req.on("error", (error) => {
      clearTimeout(timeout);
      console.warn(`Network error for ${extensionId}:`, error.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processExtensionsBatch(extensionIds, batchIndex, totalBatches) {
  console.log(
    `Processing batch ${batchIndex + 1}/${totalBatches} (${
      extensionIds.length
    } extensions)...`
  );

  // Process all extensions in the batch concurrently
  const promises = extensionIds.map(async (extensionId, index) => {
    try {
      // Add a small staggered delay to avoid overwhelming the API
      await delay(index * 100); // 100ms between each request in the batch

      const info = await getExtensionInfo(extensionId);
      if (info) {
        console.log(`  ✓ ${extensionId} - ${info.displayName}`);
        return info;
      } else {
        console.log(`  ✗ ${extensionId} - Failed to resolve`);
        return null;
      }
    } catch (error) {
      console.log(`  ✗ ${extensionId} - Error: ${error.message}`);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((result) => result !== null);
}

async function processExtensionsFile(inputFile) {
  try {
    // Read the input file
    const inputPath = path.resolve(inputFile);
    const inputContent = fs.readFileSync(inputPath, "utf8");
    const extensionIds = JSON.parse(inputContent);

    if (!Array.isArray(extensionIds)) {
      throw new Error("Input file must contain an array of extension IDs");
    }

    console.log(
      `Processing ${extensionIds.length} extensions asynchronously...`
    );

    // Process extensions in larger batches for better concurrency
    // But keep batch sizes reasonable to respect rate limits
    const batchSize = 10; // Increased from 5 for better parallelism
    const batches = [];

    for (let i = 0; i < extensionIds.length; i += batchSize) {
      batches.push(extensionIds.slice(i, i + batchSize));
    }

    console.log(
      `Split into ${batches.length} batches of up to ${batchSize} extensions each.`
    );

    const allResolvedExtensions = [];
    const startTime = Date.now();

    // Process batches with controlled concurrency
    const maxConcurrentBatches = 3; // Process up to 3 batches simultaneously

    for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
      const batchGroup = batches.slice(i, i + maxConcurrentBatches);

      // Process this group of batches concurrently
      const batchPromises = batchGroup.map((batch, localIndex) =>
        processExtensionsBatch(batch, i + localIndex, batches.length)
      );

      const batchResults = await Promise.all(batchPromises);

      // Flatten and add results
      for (const batchResult of batchResults) {
        allResolvedExtensions.push(...batchResult);
      }

      // Add delay between batch groups to respect rate limits
      if (i + maxConcurrentBatches < batches.length) {
        console.log(
          `Completed batch group ${
            Math.floor(i / maxConcurrentBatches) + 1
          }. Pausing briefly...`
        );
        await delay(2000); // 2 second pause between batch groups
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Generate output filename
    const inputDir = path.dirname(inputPath);
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(inputDir, `${inputBasename}-resolved.json`);

    // Save the resolved extensions
    fs.writeFileSync(
      outputPath,
      JSON.stringify(allResolvedExtensions, null, 2),
      "utf8"
    );

    console.log(`\n🎉 Completed in ${duration.toFixed(1)} seconds!`);
    console.log(
      `📊 Resolved ${allResolvedExtensions.length}/${extensionIds.length} extensions.`
    );
    console.log(
      `⚡ Average: ${(allResolvedExtensions.length / duration).toFixed(
        1
      )} extensions/second`
    );
    console.log(`💾 Output saved to: ${outputPath}`);

    return {
      total: extensionIds.length,
      resolved: allResolvedExtensions.length,
      failed: extensionIds.length - allResolvedExtensions.length,
      duration,
      outputPath,
    };
  } catch (error) {
    console.error("Error processing file:", error.message);
    process.exit(1);
  }
}

// Usage
const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Usage: node save-extensions-info-async.mjs <input-file.json>");
  console.error("Example: node save-extensions-info-async.mjs ext.json");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

console.log("🚀 Starting async extension resolution...");
processExtensionsFile(inputFile).catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
