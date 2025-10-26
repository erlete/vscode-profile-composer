import https from "https";

async function getExtensionInfo(extensionId) {
  const [publisher, name] = extensionId.split(".");

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
            });
          } else {
            reject(new Error("Extension not found"));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// Usage
const extensionId = process.argv[2] || "beardedbear.beardedtheme";
try {
  const info = await getExtensionInfo(extensionId);
  console.log(JSON.stringify(info, null, 2));
} catch (error) {
  console.error("Error:", error.message);
}
