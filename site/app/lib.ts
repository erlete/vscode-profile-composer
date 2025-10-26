import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

/**
 * Given a list of params, generate the permutation list.
 *
 * If the input value is, say, ['a', 'b', 'c'], the output should be:
 * ['a', 'b', 'c', 'a,b', 'a,c', 'b,c', 'a,b,c', 'b,c,a', ...].
 *
 * @param {string[]} schemas
 * @returns {string[]}
 */
function paramCombinations(schemas: string[]): string[] {
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
 * Read JSON data from public/data directory
 */
function readTestData() {
  try {
    const publicDir = join(process.cwd(), "public", "data");
    const test1Path = join(publicDir, "test1.json");
    const test2Path = join(publicDir, "test2.json");

    const test1Data = JSON.parse(readFileSync(test1Path, "utf-8"));
    const test2Data = JSON.parse(readFileSync(test2Path, "utf-8"));

    return test1Data;
    return { test1: test1Data, test2: test2Data };
  } catch (error) {
    console.error("Error reading test data:", error);
    return {
      test1: { error: "Failed to load test1.json" },
      test2: { error: "Failed to load test2.json" },
    };
  }
}

// Generate static params from schemas
export async function generateStaticParams() {
  // For demo purposes, we return hardcoded values.
  // In a real app, you might fetch this from a database or filesystem.
  const schemas = ["default", "web-development", "data-science", "devops"];

  // Map all non-empty combinations of the schemas (canonical sorted order):
  const combinations = paramCombinations(schemas);
  console.log("param combinations:", combinations);
  return combinations.map((schemaCombo) => ({ schemas: schemaCombo }));
}

// GET handler for static export - reads test data from public/data directory
export async function GET(
  request: Request,
  { params }: { params: Promise<{ schemas: string }> }
) {
  try {
    const resolvedParams = await params;
    const testData = readTestData();

    return NextResponse.json(testData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json({
      schemas: resolvedParams.schemas,
      data: testData,
      timestamp: new Date().toISOString(),
      message: `Profile data for schemas: ${resolvedParams.schemas}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load profile data" },
      { status: 500 }
    );
  }
}
