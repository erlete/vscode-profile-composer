import https from "https";

/**
 * Profile compiler - converts resolved templates to VS Code profile format
 * Handles different component types and generates proper VS Code profile structure
 */

export class ProfileCompiler {
  constructor() {
    this.extensionInfoCache = new Map();
  }

  /**
   * Compile a complete VS Code profile from resolved templates
   * @param {Object} resolvedTemplates - object with keys: extensions, settings, etc.
   * @param {Object} options - compilation options
   * @returns {Promise<Object>} complete VS Code profile
   */
  async compileProfile(resolvedTemplates, options = {}) {
    // Follow VS Code's IUserDataProfileTemplate interface
    const profile = {
      name: options.name || "Generated Profile",
    };

    // Add optional icon if provided
    if (options.icon) {
      profile.icon = options.icon;
    }

    // Compile extensions as JSON string
    if (resolvedTemplates.extensions && resolvedTemplates.extensions.content) {
      profile.extensions = await this.compileExtensions(
        resolvedTemplates.extensions.content,
        options
      );
    }

    // Compile settings as JSON string
    if (resolvedTemplates.settings && resolvedTemplates.settings.content) {
      profile.settings = this.compileSettings(
        resolvedTemplates.settings.content
      );
    }

    // Compile keybindings as JSON string if present
    if (
      resolvedTemplates.keybindings &&
      resolvedTemplates.keybindings.content
    ) {
      profile.keybindings = this.compileKeybindings(
        resolvedTemplates.keybindings.content
      );
    }

    // Compile tasks as JSON string if present
    if (resolvedTemplates.tasks && resolvedTemplates.tasks.content) {
      profile.tasks = this.compileTasks(resolvedTemplates.tasks.content);
    }

    // Compile snippets as JSON string if present
    if (resolvedTemplates.snippets && resolvedTemplates.snippets.content) {
      profile.snippets = this.compileSnippets(
        resolvedTemplates.snippets.content
      );
    }

    // Compile globalState as JSON string if present
    if (
      resolvedTemplates.globalState &&
      resolvedTemplates.globalState.content
    ) {
      profile.globalState = this.compileGlobalState(
        resolvedTemplates.globalState.content
      );
    }

    return profile;
  }

  /**
   * Compile extensions array to VS Code extension format
   * @param {string[]} extensionIds - array of extension IDs
   * @param {Object} options - compilation options
   * @returns {Promise<string>} extensions JSON string for VS Code profile
   */
  async compileExtensions(extensionIds, options = {}) {
    const extensions = [];

    if (options.fetchExtensionInfo !== false) {
      // Fetch extension information for each extension
      for (const extensionId of extensionIds) {
        try {
          let extensionInfo = this.extensionInfoCache.get(extensionId);

          if (!extensionInfo) {
            extensionInfo = await this.getExtensionInfo(extensionId);
            this.extensionInfoCache.set(extensionId, extensionInfo);
          }

          if (extensionInfo) {
            // Follow VS Code's IProfileExtension interface
            extensions.push({
              identifier: {
                id: extensionId,
                uuid: extensionInfo.identifier?.uuid || this.generateUUID(),
              },
              displayName: extensionInfo.displayName || extensionId,
              version: extensionInfo.version,
              preRelease: extensionInfo.preRelease || false,
              applicationScoped: extensionInfo.applicationScoped || false,
              disabled: false,
            });
          } else {
            // Fallback for extensions that couldn't be fetched
            extensions.push({
              identifier: {
                id: extensionId,
                uuid: this.generateUUID(),
              },
              displayName: extensionId,
              applicationScoped: false,
              disabled: false,
            });
          }
        } catch (error) {
          console.warn(
            `Failed to fetch info for extension ${extensionId}: ${error.message}`
          );

          // Add extension without detailed info
          extensions.push({
            identifier: {
              id: extensionId,
              uuid: this.generateUUID(),
            },
            displayName: extensionId,
            applicationScoped: false,
            disabled: false,
          });
        }
      }
    } else {
      // Simple mode without fetching extension info
      for (const id of extensionIds) {
        extensions.push({
          identifier: {
            id: id,
            uuid: this.generateUUID(),
          },
          displayName: id,
          applicationScoped: false,
          disabled: false,
        });
      }
    }

    // Return as JSON string as required by VS Code profile format
    return JSON.stringify(extensions);
  }

  /**
   * Compile settings object
   * @param {Object} settings - settings key-value pairs
   * @returns {string} settings JSON string for VS Code profile
   */
  compileSettings(settings) {
    // Follow VS Code's ISettingsContent format
    const settingsContent = {
      settings: JSON.stringify(settings, null, 2),
    };
    return JSON.stringify(settingsContent);
  }

  /**
   * Compile keybindings array
   * @param {Array} keybindings - array of keybinding objects
   * @returns {string} keybindings JSON string for VS Code profile
   */
  compileKeybindings(keybindings) {
    // Wrap keybindings in an object similar to settings format
    // VS Code expects: {"keybindings": "<json-string-array>", "platform": 3}
    const keybindingsJson = JSON.stringify([...keybindings], null, 2);
    const wrapper = {
      keybindings: keybindingsJson,
      platform: 3, // 3 = cross-platform
    };
    return JSON.stringify(wrapper);
  }

  /**
   * Compile tasks configuration
   * @param {Object} tasks - tasks configuration
   * @returns {string} tasks JSON string for VS Code profile
   */
  compileTasks(tasks) {
    const tasksConfig = {
      version: "2.0.0",
      ...tasks,
    };
    return JSON.stringify(tasksConfig);
  }

  /**
   * Compile snippets
   * @param {Object} snippets - snippets organized by language
   * @returns {string} snippets JSON string for VS Code profile
   */
  compileSnippets(snippets) {
    return JSON.stringify({ ...snippets });
  }

  /**
   * Compile global state
   * @param {Object} globalState - global state object
   * @returns {string} global state JSON string for VS Code profile
   */
  compileGlobalState(globalState) {
    return JSON.stringify({ ...globalState });
  }

  /**
   * Generate a UUID for extensions (simple implementation)
   * @returns {string} generated UUID
   */
  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  /**
   * Clear the extension info cache
   */
  clearCache() {
    this.extensionInfoCache.clear();
  }

  getExtensionInfo(extensionId) {
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
}

export default ProfileCompiler;
