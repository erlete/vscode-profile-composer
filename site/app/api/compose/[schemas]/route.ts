import { NextResponse } from "next/server";
import { readManifest, readSchema } from "@/app/lib";

export const dynamic = "force-static";
export const revalidate = 0;

export async function generateStaticParams() {
  return readManifest().map((schemaCombo) => ({ schemas: schemaCombo }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schemas: string }> }
) {
  try {
    const schemaList = (await params).schemas;
    if (!readManifest().includes(schemaList)) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(readSchema(`${schemaList}.code-profile`), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load profile data" },
      { status: 500 }
    );
  }
}
