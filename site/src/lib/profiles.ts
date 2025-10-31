import { readFileSync } from 'fs'
import { join } from 'path'

// region Configuration

/**
 * Path to the directory containing profile fragments.
 */
export const FRAGMENTS_DIR = join(process.cwd(), 'public', 'fragments')

/**
 * Path to the file profile fragments manifest.
 */
export const MANIFEST_FILE = join(
  process.cwd(),
  'public',
  'fragments',
  'manifest.json'
)

// region Helpers

/**
 * Removes any kind of JSON comments from a string.
 *
 * @param {string} jsonString - The JSON string potentially containing comments.
 * @returns {string} - The JSON string with comments removed.
 */
function removeJsonComments(jsonString: string): string {
  return jsonString
    .replace(/\/\/.*$/gm, '') // Remove single-line comments (// comment)
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments (/* comment */)
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before closing brackets
}

/**
 * Parses and unescapes JSON strings that may be double-encoded.
 *
 * @param {string} jsonString - The JSON string to parse.
 * @returns {any} - The parsed JSON object.
 */
function parseNestedJson(jsonString: string): any {
  try {
    // Parse the outer JSON string:
    let parsed = JSON.parse(jsonString)

    // If the result is still a string, parse it again and remove comments:
    if (typeof parsed === 'string') {
      const cleaned = removeJsonComments(parsed)

      parsed = JSON.parse(cleaned)
    }

    return parsed
  } catch (error: any) {
    console.warn('Failed to parse JSON:', error.message)

    return {}
  }
}

/**
 * Recursively parses JSON string values in an object.
 *
 * @param {any} obj - The object to parse.
 * @returns {any} - The object with JSON strings parsed.
 */
function parseJsonStringsInObject(obj: any): any {
  // Handle JSON arrays:
  if (Array.isArray(obj)) {
    return obj.map((item) => parseJsonStringsInObject(item))
  }

  if (obj && typeof obj === 'object') {
    const result: any = {}

    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === 'string' &&
        (value.startsWith('[') || value.startsWith('{'))
      ) {
        // Try to parse the string as JSON or keep original string:
        try {
          result[key] = JSON.parse(value)
        } catch {
          result[key] = value
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects:
        result[key] = parseJsonStringsInObject(value)
      } else {
        // Keep primitive values as-is:
        result[key] = value
      }
    }

    return result
  }

  return obj
}

/**
 * Deeply merges two fragments without duplicating properties.
 *
 * @param {any} target - The target fragment object.
 * @param {any} source - The source fragment object.
 * @returns {any} - The merged fragment object.
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        // If both target and source have the same key and both are objects,
        // merge recursively:
        if (
          result[key] &&
          typeof result[key] === 'object' &&
          !Array.isArray(result[key])
        ) {
          result[key] = deepMerge(result[key], source[key])
        } else {
          result[key] = { ...source[key] }
        }
      } else if (Array.isArray(source[key])) {
        // Handle arrays (merge and deduplicate):
        if (Array.isArray(result[key])) {
          const merged = [...result[key]]

          for (const item of source[key]) {
            // Check if item already exists:
            let exists = false

            if (
              typeof item === 'object' &&
              item !== null &&
              item.identifier &&
              item.identifier.id
            ) {
              // Extension object (check by identifier.id):
              exists = merged.some(
                (existing: any) =>
                  existing.identifier &&
                  existing.identifier.id === item.identifier.id
              )
            } else {
              // Simple value (check direct equality):
              exists = merged.some(
                (existing: any) =>
                  JSON.stringify(existing) === JSON.stringify(item)
              )
            }

            if (!exists) {
              merged.push(item)
            }
          }
          result[key] = merged
        } else {
          result[key] = [...source[key]]
        }
      } else {
        // Primitive value (source overwrites target):
        result[key] = source[key]
      }
    }
  }

  return result
}

// region Profiles

/**
 * Read fragment (profile fragments) names from the manifest.
 *
 * @returns {string[]} - List of all fragment names present on the manifest.
 */
export function readManifestFragmentNames(): string[] {
  return (
    JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8')).profiles.map(
      (m: any) => m.name
    ) as string[]
  ).toSorted()
}

/**
 * Composes a profile from one or more fragments.
 *
 * @param {string[]} fragmentNames - Array of fragment names to compose the profile from.
 * @returns {object} - The composed profile object.
 */
export function composeProfile(fragmentNames: string[]): object {
  // Load all profile fragments:
  const fragments = fragmentNames.map((fragment) =>
    JSON.parse(
      readFileSync(
        join(FRAGMENTS_DIR, `${fragment.toLowerCase()}.code-profile`),
        'utf-8'
      )
    )
  )

  // If only one profile, return it directly:
  if (fragments.length === 1)
    return {
      ...fragments[0],
      name: `VSCode Profile Composer (${fragmentNames.join(',').toLowerCase()})`,
    }

  // Initialize merged data structures
  const merged = {
    name: `VSCode Profile Composer (${fragmentNames.join(',').toLowerCase()})`,
    settings: {},
    keybindings: [],
    tasks: {},
    extensions: [],
    globalState: {},
    snippets: {},
  }

  // Process each profile:
  for (let i = 0; i < fragments.length; i++) {
    const profile = fragments[i]
    const fragmentName = fragmentNames[i]

    try {
      // Process each key in the profile
      for (const [key, value] of Object.entries(profile)) {
        if (key === 'name' || key === 'icon') {
          // Skip metadata fields
          continue
        }

        if (merged.hasOwnProperty(key) && typeof value === 'string') {
          let parsedValue: any

          try {
            // Parse the JSON string value
            parsedValue = parseNestedJson(value)

            // Special handling for settings
            if (key === 'settings') {
              // Extract the settings object from the parsed object
              if (
                parsedValue.settings &&
                typeof parsedValue.settings === 'string'
              ) {
                try {
                  parsedValue = JSON.parse(parsedValue.settings)
                } catch (error: any) {
                  console.warn(
                    `Failed to parse settings in ${fragmentName}:`,
                    error.message
                  )
                  parsedValue = {}
                }
              }
            }

            // Special handling for keybindings
            if (key === 'keybindings') {
              // Extract the keybindings array from the parsed object
              if (
                parsedValue.keybindings &&
                typeof parsedValue.keybindings === 'string'
              ) {
                try {
                  const cleanedKeybindings = removeJsonComments(
                    parsedValue.keybindings
                  )
                  const keybindingsArray = JSON.parse(cleanedKeybindings)

                  if (Array.isArray(keybindingsArray)) {
                    parsedValue = keybindingsArray
                  }
                } catch (error: any) {
                  console.warn(
                    `Failed to parse keybindings in ${fragmentName}:`,
                    error.message
                  )
                  parsedValue = []
                }
              } else if (Array.isArray(parsedValue)) {
                // Already an array
                parsedValue = parsedValue
              } else {
                console.warn(`Unexpected keybindings format in ${fragmentName}`)
                parsedValue = []
              }
            }

            // Special handling for tasks
            if (key === 'tasks') {
              // Extract the tasks object from the parsed object
              if (parsedValue.tasks && typeof parsedValue.tasks === 'string') {
                try {
                  const cleanedTasks = removeJsonComments(parsedValue.tasks)

                  parsedValue = JSON.parse(cleanedTasks)
                } catch (error: any) {
                  console.warn(
                    `Failed to parse tasks in ${fragmentName}:`,
                    error.message
                  )
                  parsedValue = {}
                }
              }
            }

            // Special handling for globalState
            if (key === 'globalState') {
              // Extract the globalState object from the parsed object
              if (parsedValue.storage) {
                parsedValue = parsedValue.storage
              }
              // Parse JSON string values recursively
              parsedValue = parseJsonStringsInObject(parsedValue)
            }

            // Special handling for snippets
            if (key === 'snippets') {
              // Snippets should be an object, not an array
              if (
                typeof parsedValue !== 'object' ||
                Array.isArray(parsedValue)
              ) {
                console.warn(
                  `Expected snippets to be an object in ${fragmentName}`
                )
                parsedValue = {}
              }
            }

            // Special handling for extensions
            if (key === 'extensions') {
              if (!Array.isArray(parsedValue)) {
                console.warn(
                  `Expected extensions to be an array in ${fragmentName}`
                )
                continue
              }
            }

            // Merge the parsed value
            if (Array.isArray(parsedValue)) {
              // For arrays, use array merging logic
              ;(merged as any)[key] = deepMerge(
                { temp: (merged as any)[key] },
                { temp: parsedValue }
              ).temp
            } else if (
              typeof parsedValue === 'object' &&
              parsedValue !== null
            ) {
              // For objects, use deep merge
              ;(merged as any)[key] = deepMerge(
                (merged as any)[key],
                parsedValue
              )
            } else {
              console.warn(
                `Unexpected value type for key ${key} in ${fragmentName}`
              )
            }
          } catch (error: any) {
            console.warn(
              `Failed to process ${key} in ${fragmentName}:`,
              error.message
            )
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to process profile ${fragmentName}:`, error.message)
    }
  }

  // Convert back to VS Code profile format (JSON strings):
  return {
    name: merged.name,
    extensions: JSON.stringify(merged.extensions),
    settings: JSON.stringify({ settings: JSON.stringify(merged.settings) }),
    keybindings: JSON.stringify({
      keybindings: JSON.stringify(merged.keybindings),
      platform: 3,
    }),
    tasks: JSON.stringify(merged.tasks),
    snippets: JSON.stringify(merged.snippets),
    globalState: JSON.stringify(merged.globalState),
  }
}
