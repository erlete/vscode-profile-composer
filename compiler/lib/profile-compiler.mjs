import { getExtensionInfo } from "./fetch-extension-info.mjs";

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
    const profile = {
      name: options.name || "Generated Profile",
      extensions: {},
      settings: {},
      keybindings: [],
      tasks: {},
      snippets: {},
    };

    // Compile extensions
    if (resolvedTemplates.extensions && resolvedTemplates.extensions.content) {
      profile.extensions = await this.compileExtensions(
        resolvedTemplates.extensions.content,
        options
      );
    }

    // Compile settings
    if (resolvedTemplates.settings && resolvedTemplates.settings.content) {
      profile.settings = this.compileSettings(
        resolvedTemplates.settings.content
      );
    }

    // Compile keybindings if present
    if (
      resolvedTemplates.keybindings &&
      resolvedTemplates.keybindings.content
    ) {
      profile.keybindings = this.compileKeybindings(
        resolvedTemplates.keybindings.content
      );
    }

    // Compile tasks if present
    if (resolvedTemplates.tasks && resolvedTemplates.tasks.content) {
      profile.tasks = this.compileTasks(resolvedTemplates.tasks.content);
    }

    // Compile snippets if present
    if (resolvedTemplates.snippets && resolvedTemplates.snippets.content) {
      profile.snippets = this.compileSnippets(
        resolvedTemplates.snippets.content
      );
    }

    return profile;
  }

  /**
   * Compile extensions array to VS Code extension format
   * @param {string[]} extensionIds - array of extension IDs
   * @param {Object} options - compilation options
   * @returns {Promise<Object>} extensions object for VS Code profile
   */
  async compileExtensions(extensionIds, options = {}) {
    const extensions = {
      list: [],
    };

    if (options.fetchExtensionInfo !== false) {
      // Fetch extension information for each extension
      for (const extensionId of extensionIds) {
        try {
          let extensionInfo = this.extensionInfoCache.get(extensionId);

          if (!extensionInfo) {
            extensionInfo = await getExtensionInfo(extensionId);
            this.extensionInfoCache.set(extensionId, extensionInfo);
          }

          if (extensionInfo) {
            extensions.list.push({
              identifier: {
                id: extensionInfo.identifier.id,
                uuid: extensionInfo.identifier.uuid || this.generateUUID(),
              },
              displayName: extensionInfo.displayName || extensionId,
              version: extensionInfo.version || "latest",
              applicationScoped: extensionInfo.applicationScoped || false,
            });
          } else {
            // Fallback for extensions that couldn't be fetched
            extensions.list.push({
              identifier: {
                id: extensionId,
                uuid: this.generateUUID(),
              },
              displayName: extensionId,
              version: "latest",
              applicationScoped: false,
            });
          }
        } catch (error) {
          console.warn(
            `Failed to fetch info for extension ${extensionId}: ${error.message}`
          );
          // Add extension without detailed info
          extensions.list.push({
            identifier: {
              id: extensionId,
              uuid: this.generateUUID(),
            },
            displayName: extensionId,
            version: "latest",
            applicationScoped: false,
          });
        }
      }
    } else {
      // Simple mode without fetching extension info
      extensions.list = extensionIds.map((id) => ({
        identifier: {
          id: id,
          uuid: this.generateUUID(),
        },
        displayName: id,
        version: "latest",
        applicationScoped: false,
      }));
    }

    return extensions;
  }

  /**
   * Compile settings object
   * @param {Object} settings - settings key-value pairs
   * @returns {Object} settings object for VS Code profile
   */
  compileSettings(settings) {
    return { ...settings };
  }

  /**
   * Compile keybindings array
   * @param {Array} keybindings - array of keybinding objects
   * @returns {Array} keybindings array for VS Code profile
   */
  compileKeybindings(keybindings) {
    return [...keybindings];
  }

  /**
   * Compile tasks configuration
   * @param {Object} tasks - tasks configuration
   * @returns {Object} tasks object for VS Code profile
   */
  compileTasks(tasks) {
    return {
      version: "2.0.0",
      ...tasks,
    };
  }

  /**
   * Compile snippets
   * @param {Object} snippets - snippets organized by language
   * @returns {Object} snippets object for VS Code profile
   */
  compileSnippets(snippets) {
    return { ...snippets };
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
}

export default ProfileCompiler;
