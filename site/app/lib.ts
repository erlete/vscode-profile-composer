import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

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
