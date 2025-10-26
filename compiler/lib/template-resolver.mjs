import { promises as fs } from "fs";
import path from "path";

/**
 * Template resolver - handles dependency resolution and template merging
 * Supports inheritance through the "extends" property in templates
 */

export class TemplateResolver {
  constructor(templatesDir) {
    this.templatesDir = templatesDir;
    this.cache = new Map();
    this.resolveStack = new Set(); // For circular dependency detection
  }

  /**
   * Resolve a template with all its dependencies
   * @param {string} category - bundles, frameworks, or languages
   * @param {string} templateName - name of the template
   * @param {string} componentType - extensions, settings, etc.
   * @returns {Promise<Object>} resolved template content
   */
  async resolveTemplate(category, templateName, componentType) {
    const cacheKey = `${category}/${templateName}/${componentType}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.resolveStack.has(cacheKey)) {
      throw new Error(
        `Circular dependency detected: ${Array.from(this.resolveStack).join(
          " -> "
        )} -> ${cacheKey}`
      );
    }

    this.resolveStack.add(cacheKey);

    try {
      const templatePath = path.join(
        this.templatesDir,
        category,
        templateName,
        `${componentType}.json`
      );
      const template = await this.loadTemplate(templatePath);
      const resolved = await this.resolveExtends(template, componentType);

      this.cache.set(cacheKey, resolved);
      return resolved;
    } finally {
      this.resolveStack.delete(cacheKey);
    }
  }

  /**
   * Load a template file and parse it
   * @param {string} templatePath - path to template file
   * @returns {Promise<Object>} parsed template
   */
  async loadTemplate(templatePath) {
    try {
      const content = await fs.readFile(templatePath, "utf-8");
      // Remove comments for JSON parsing
      const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      return JSON.parse(cleanContent);
    } catch (error) {
      if (error.code === "ENOENT") {
        // Return empty template if file doesn't exist
        return { content: [] };
      }
      throw new Error(
        `Failed to load template ${templatePath}: ${error.message}`
      );
    }
  }

  /**
   * Resolve all extends dependencies and merge content
   * @param {Object} template - the template object
   * @param {string} componentType - extensions, settings, etc.
   * @returns {Promise<Object>} resolved template with merged content
   */
  async resolveExtends(template, componentType) {
    if (!template.extends) {
      return template;
    }

    const mergedContent = [];
    const mergedSettings = {};

    // Process extends in order: bundles, frameworks, languages
    const categories = ["bundles", "frameworks", "languages"];

    for (const category of categories) {
      if (template.extends[category]) {
        for (const templateName of template.extends[category]) {
          const extendedTemplate = await this.resolveTemplate(
            category,
            templateName,
            componentType
          );

          if (componentType === "extensions") {
            // For extensions, merge arrays
            if (extendedTemplate.content) {
              mergedContent.push(...extendedTemplate.content);
            }
          } else if (componentType === "settings") {
            // For settings, merge objects
            if (extendedTemplate.content) {
              Object.assign(mergedSettings, extendedTemplate.content);
            }
          }
        }
      }
    }

    // Add current template's content
    if (componentType === "extensions") {
      if (template.content) {
        mergedContent.push(...template.content);
      }
      // Remove duplicates while preserving order
      const uniqueContent = [...new Set(mergedContent)];
      return { ...template, content: uniqueContent };
    } else if (componentType === "settings") {
      if (template.content) {
        Object.assign(mergedSettings, template.content);
      }
      return { ...template, content: mergedSettings };
    }

    return template;
  }

  /**
   * Get all available templates in a category
   * @param {string} category - bundles, frameworks, or languages
   * @returns {Promise<string[]>} array of template names
   */
  async getAvailableTemplates(category) {
    try {
      const categoryPath = path.join(this.templatesDir, category);
      const items = await fs.readdir(categoryPath, { withFileTypes: true });
      return items
        .filter((item) => item.isDirectory())
        .map((item) => item.name);
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  /**
   * Clear the resolution cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default TemplateResolver;
