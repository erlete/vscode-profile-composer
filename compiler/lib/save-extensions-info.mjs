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
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
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
      console.warn(`Network error for ${extensionId}:`, error.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
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

    console.log(`Processing ${extensionIds.length} extensions...`);

    // Process extensions in batches to avoid overwhelming the API
    const batchSize = 5;
    const resolvedExtensions = [];

    for (let i = 0; i < extensionIds.length; i += batchSize) {
      const batch = extensionIds.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          extensionIds.length / batchSize
        )}...`
      );

      const batchPromises = batch.map(async (extensionId) => {
        try {
          const info = await getExtensionInfo(extensionId);
          if (info) {
            console.log(`✓ ${extensionId} - ${info.displayName}`);
            return info;
          } else {
            console.log(`✗ ${extensionId} - Failed to resolve`);
            return null;
          }
        } catch (error) {
          console.log(`✗ ${extensionId} - Error: ${error.message}`);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      resolvedExtensions.push(
        ...batchResults.filter((result) => result !== null)
      );

      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < extensionIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Generate output filename
    const inputDir = path.dirname(inputPath);
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(inputDir, `${inputBasename}-resolved.json`);

    // Save the resolved extensions
    fs.writeFileSync(
      outputPath,
      JSON.stringify(resolvedExtensions, null, 2),
      "utf8"
    );

    console.log(
      `\nCompleted! Resolved ${resolvedExtensions.length}/${extensionIds.length} extensions.`
    );
    console.log(`Output saved to: ${outputPath}`);

    return {
      total: extensionIds.length,
      resolved: resolvedExtensions.length,
      failed: extensionIds.length - resolvedExtensions.length,
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
  console.error("Usage: node save-extensions-info.mjs <input-file.json>");
  console.error("Example: node save-extensions-info.mjs ext.json");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

processExtensionsFile(inputFile).catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
