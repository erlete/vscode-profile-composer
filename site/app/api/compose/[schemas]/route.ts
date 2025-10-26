import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { paramCombinations, readTestData } from "@/app/lib";

export const dynamic = "force-static";

export async function generateStaticParams() {
  // For demo purposes, we return hardcoded values.
  // In a real app, you might fetch this from a database or filesystem.
  const schemas = ["default", "web-development", "data-science", "devops"];

  // Map all non-empty combinations of the schemas (canonical sorted order):
  const combinations = paramCombinations(schemas);
  console.log("param combinations:", combinations);
  return combinations.map((schemaCombo) => ({ schemas: schemaCombo }));
}

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
