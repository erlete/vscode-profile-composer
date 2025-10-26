import { NextResponse } from "next/server";
import {
  paramCombinations,
  readManifest,
  readSchema,
  readSchema2,
} from "@/app/lib";

export const dynamic = "force-static";
export const revalidate = 0;

export async function generateStaticParams() {
  try {
    const manifest = readManifest();
    const combinations = paramCombinations(manifest);
    const paths = combinations.map((schemaCombo) => ({
      schemas: schemaCombo,
    }));
    console.log(
      `generateStaticParams: ${JSON.stringify(paths).length} segments`
    );
    return paths;
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schemas: string }> }
) {
  try {
    const resolvedParams = await params;
    const schemaList = resolvedParams.schemas;
    const manifest = readManifest();
    const combinations = paramCombinations(manifest);

    console.log(
      `current path: ${schemaList}, in manifest?: ${combinations.includes(schemaList)}`
    );

    // Error case: requested profile not present in manifest:
    if (!combinations.includes(schemaList)) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileData = readSchema2(schemaList);
    console.log(`profile data: ${JSON.stringify(profileData).length} bytes`);

    return NextResponse.json(profileData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/compose/[schemas]:", error);
    return NextResponse.json(
      { error: "Failed to load profile data" },
      { status: 500 }
    );
  }
}
