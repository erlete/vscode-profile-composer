import { readFileSync } from "fs";
import { join } from "path";

/**
 * Read JSON data from public/gists directory
 */
export function readManifest(): string[] {
  const publicDir = join(process.cwd(), "public", "gists");
  const manifestData = JSON.parse(
    readFileSync(join(publicDir, "manifest.json"), "utf-8")
  );

  const names: string[] = manifestData.profiles.map((m: any) => m.name);
  const paths: string[] = [...names].sort((a, b) => a.localeCompare(b));

  return paths;
}

/**
 * Given a list of params, generate the permutation list.
 *
 * If the input value is, say, ['a', 'b', 'c'], the output should be:
 * ['a', 'b', 'c', 'a,b', 'a,c', 'b,c', 'a,b,c', 'b,c,a', ...].
 *
 * @param {string[]} schemas
 * @returns {string[]}
 */
export function paramCombinations(schemas: string[]): string[] {
  if (!schemas || schemas.length === 0) return [];

  // Ensure input is sorted so combinations are canonical (e.g. "default,devops")
  const sorted = [...schemas].sort();
  const n = sorted.length;
  const total = 1 << n;
  const results = new Set<string>();

  for (let mask = 1; mask < total; mask++) {
    const combo: string[] = [];
    for (let j = 0; j < n; j++) {
      if (mask & (1 << j)) combo.push(sorted[j]);
    }
    results.add(combo.join(","));
  }

  return Array.from(results);
}

/**
 * Read JSON data from public/gists directory
 */
export function readSchema(fileName: string) {
  const publicDir = join(process.cwd(), "public", "gists");
  const customData = JSON.parse(
    readFileSync(join(publicDir, fileName), "utf-8")
  );

  return customData;
}

/**
 * Deeply merges two objects without duplicating properties
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        // If both target and source have the same key and both are objects, merge recursively
        if (
          result[key] &&
          typeof result[key] === "object" &&
          !Array.isArray(result[key])
        ) {
          result[key] = deepMerge(result[key], source[key]);
        } else {
          result[key] = { ...source[key] };
        }
      } else if (Array.isArray(source[key])) {
        // Handle arrays - merge and deduplicate
        if (Array.isArray(result[key])) {
          // Merge arrays and remove duplicates for extension objects
          const merged = [...result[key]];

          for (const item of source[key]) {
            // Check if item already exists (for extensions, check by identifier.id)
            let exists = false;

            if (
              typeof item === "object" &&
              item !== null &&
              item.identifier &&
              item.identifier.id
            ) {
              // Extension object - check by identifier.id
              exists = merged.some(
                (existing: any) =>
                  existing.identifier &&
                  existing.identifier.id === item.identifier.id
              );
            } else {
              // Simple value - check direct equality
              exists = merged.some(
                (existing: any) =>
                  JSON.stringify(existing) === JSON.stringify(item)
              );
            }

            if (!exists) {
              merged.push(item);
            }
          }
          result[key] = merged;
        } else {
          result[key] = [...source[key]];
        }
      } else {
        // Primitive value - source overwrites target
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Removes JSON comments from a string
 */
function removeJsonComments(jsonString: string): string {
  // Remove single-line comments (// comment)
  let cleaned = jsonString.replace(/\/\/.*$/gm, "");

  // Remove multi-line comments (/* comment */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove trailing commas before closing brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  return cleaned;
}

/**
 * Parses and unescapes JSON strings that may be double-encoded
 */
function parseNestedJson(jsonString: string): any {
  try {
    // First, parse the outer JSON string
    let parsed = JSON.parse(jsonString);

    // If the result is still a string, parse it again (may contain comments)
    if (typeof parsed === "string") {
      const cleaned = removeJsonComments(parsed);
      parsed = JSON.parse(cleaned);
    }

    return parsed;
  } catch (error: any) {
    console.warn("Failed to parse JSON:", error.message);
    return {};
  }
}

/**
 * Recursively parses JSON string values in an object
 */
function parseJsonStringsInObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => parseJsonStringsInObject(item));
  }

  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === "string" &&
        (value.startsWith("[") || value.startsWith("{"))
      ) {
        try {
          // Try to parse the string as JSON
          result[key] = JSON.parse(value);
        } catch (error) {
          // If parsing fails, keep the original string
          result[key] = value;
        }
      } else if (typeof value === "object" && value !== null) {
        // Recursively process nested objects
        result[key] = parseJsonStringsInObject(value);
      } else {
        // Keep primitive values as-is
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

/**
 * Merges multiple VS Code profiles into a single profile
 */
export function readSchema2(fileName: string | string[]) {
  // Handle both array and string inputs
  const fragments = Array.isArray(fileName)
    ? fileName
    : fileName.replace(".code-profile", "").split(",");
  const publicDir = join(process.cwd(), "public", "gists");

  // Load all profile fragments
  const profiles = fragments.map((fragment) =>
    JSON.parse(
      readFileSync(join(publicDir, `${fragment}.code-profile`), "utf-8")
    )
  );

  // If only one profile, return it directly
  if (profiles.length === 1) {
    return profiles[0];
  }

  // Initialize merged data structures
  const merged = {
    name: `VSCode Profile Composer (${fragments.join(",")})`,
    settings: {},
    keybindings: [],
    tasks: {},
    extensions: [],
    globalState: {},
    snippets: {},
  };

  console.log(`Merging ${profiles.length} profiles: ${fragments.join(", ")}`);

  // Process each profile
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const fragmentName = fragments[i];

    console.log(`Processing profile ${fragmentName}...`);

    try {
      // Process each key in the profile
      for (const [key, value] of Object.entries(profile)) {
        if (key === "name" || key === "icon") {
          // Skip metadata fields
          continue;
        }

        if (merged.hasOwnProperty(key) && typeof value === "string") {
          let parsedValue: any;

          try {
            // Parse the JSON string value
            parsedValue = parseNestedJson(value);

            // Special handling for settings
            if (key === "settings") {
              // Extract the settings object from the parsed object
              if (
                parsedValue.settings &&
                typeof parsedValue.settings === "string"
              ) {
                try {
                  parsedValue = JSON.parse(parsedValue.settings);
                } catch (error: any) {
                  console.warn(
                    `Failed to parse settings in ${fragmentName}:`,
                    error.message
                  );
                  parsedValue = {};
                }
              }
            }

            // Special handling for keybindings
            if (key === "keybindings") {
              // Extract the keybindings array from the parsed object
              if (
                parsedValue.keybindings &&
                typeof parsedValue.keybindings === "string"
              ) {
                try {
                  const cleanedKeybindings = removeJsonComments(
                    parsedValue.keybindings
                  );
                  const keybindingsArray = JSON.parse(cleanedKeybindings);
                  if (Array.isArray(keybindingsArray)) {
                    parsedValue = keybindingsArray;
                  }
                } catch (error: any) {
                  console.warn(
                    `Failed to parse keybindings in ${fragmentName}:`,
                    error.message
                  );
                  parsedValue = [];
                }
              } else if (Array.isArray(parsedValue)) {
                // Already an array
                parsedValue = parsedValue;
              } else {
                console.warn(
                  `Unexpected keybindings format in ${fragmentName}`
                );
                parsedValue = [];
              }
            }

            // Special handling for tasks
            if (key === "tasks") {
              // Extract the tasks object from the parsed object
              if (parsedValue.tasks && typeof parsedValue.tasks === "string") {
                try {
                  const cleanedTasks = removeJsonComments(parsedValue.tasks);
                  parsedValue = JSON.parse(cleanedTasks);
                } catch (error: any) {
                  console.warn(
                    `Failed to parse tasks in ${fragmentName}:`,
                    error.message
                  );
                  parsedValue = {};
                }
              }
            }

            // Special handling for globalState
            if (key === "globalState") {
              // Extract the globalState object from the parsed object
              if (parsedValue.storage) {
                parsedValue = parsedValue.storage;
              }
              // Parse JSON string values recursively
              parsedValue = parseJsonStringsInObject(parsedValue);
            }

            // Special handling for snippets
            if (key === "snippets") {
              // Snippets should be an object, not an array
              if (
                typeof parsedValue !== "object" ||
                Array.isArray(parsedValue)
              ) {
                console.warn(
                  `Expected snippets to be an object in ${fragmentName}`
                );
                parsedValue = {};
              }
            }

            // Special handling for extensions
            if (key === "extensions") {
              if (!Array.isArray(parsedValue)) {
                console.warn(
                  `Expected extensions to be an array in ${fragmentName}`
                );
                continue;
              }
            }

            // Merge the parsed value
            if (Array.isArray(parsedValue)) {
              // For arrays, use array merging logic
              (merged as any)[key] = deepMerge(
                { temp: (merged as any)[key] },
                { temp: parsedValue }
              ).temp;
            } else if (
              typeof parsedValue === "object" &&
              parsedValue !== null
            ) {
              // For objects, use deep merge
              (merged as any)[key] = deepMerge(
                (merged as any)[key],
                parsedValue
              );
            } else {
              console.warn(
                `Unexpected value type for key ${key} in ${fragmentName}`
              );
            }
          } catch (error: any) {
            console.warn(
              `Failed to process ${key} in ${fragmentName}:`,
              error.message
            );
          }
        }
      }
    } catch (error: any) {
      console.error(
        `Failed to process profile ${fragmentName}:`,
        error.message
      );
    }
  }

  console.log(
    `Successfully merged ${profiles.length} profiles into: ${merged.name}`
  );

  // Convert back to VS Code profile format (JSON strings)
  const result = {
    name: merged.name,
    extensions: JSON.stringify(merged.extensions),
    settings: JSON.stringify({ settings: JSON.stringify(merged.settings) }),
    keybindings: JSON.stringify(merged.keybindings),
    tasks: JSON.stringify(merged.tasks),
    snippets: JSON.stringify(merged.snippets),
    globalState: JSON.stringify(merged.globalState),
  };

  return result;
}
