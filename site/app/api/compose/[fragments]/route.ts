import { NextRequest, NextResponse } from "next/server";
import { readManifestFragmentNames, composeProfile } from "@/lib/profiles";

// region Configuration

const REVALIDATION_SECS = 3600;
export const revalidate = 3600;
export const dynamic = "force-dynamic";

// region Helpers

/**
 * Helper function for lowering case of array of strings.
 *
 * @param {string[]} s - Array of strings to convert to lowercase.
 * @returns {string[]} - Array of lowercase strings.
 */
const toLower = (s: string[]): string[] => s.map((v) => v.toLowerCase());

/**
 * Helper function to deduplicate an array of strings.
 *
 * @param {string[]} s - Array of strings to deduplicate.
 * @returns {string[]} - Deduplicated array of strings.
 */
const dedupe = (s: string[]): string[] => Array.from(new Set(s));

// region Handler

/**
 * GET handler for /api/compose/[fragments].
 *
 * This route handler is responsible for serving the requested combination of
 * fragments. If any of the requested fragments is not found, it is supressed from
 * the list of provided fragments. If the supressed fragment is the last one, a
 * 404 redirection is issued.
 *
 * @param {NextRequest} request - The incoming request object.
 * @param {Object} params - The parameters object containing the fragments.
 * @returns {Promise<NextResponse>} - The response containing the profile data or an error message.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fragments: string }> }
): Promise<NextResponse> {
  const fragments = dedupe(toLower((await params).fragments.split(",")));

  try {
    const manifestFragments = toLower(readManifestFragmentNames());
    const sanitizedFragments = dedupe(toLower(fragments.toSorted())).filter(
      (fragment) => manifestFragments.some((name) => name === fragment)
    );

    // If no fragments remain after sanitizing, return 404 with detail:
    if (sanitizedFragments.length === 0) {
      return NextResponse.json(
        {
          error: "Could not generate a profile from the requested fragments",
          details: {
            requestedFragments: fragments,
            availableFragments: manifestFragments,
          },
        },
        { status: 404 }
      );
    }

    // If fragments provided are unsorted, permanently redirect to sorted URL:
    if (JSON.stringify(fragments) !== JSON.stringify(sanitizedFragments)) {
      const url = new URL(request.url);
      url.pathname = `/api/compose/${sanitizedFragments}`;
      return NextResponse.redirect(url.toString(), {
        status: 308,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Return data with headers:
    return NextResponse.json(composeProfile(sanitizedFragments), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${REVALIDATION_SECS}, s-maxage=${REVALIDATION_SECS}, stale-while-revalidate=86400`,
        "CDN-Cache-Control": `public, max-age=${REVALIDATION_SECS}`,
        Vary: "Accept-Encoding",
        ETag: `W/"${Buffer.from(sanitizedFragments.join(",")).toString("base64")}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Log and handle internal errors:
    console.error(`[Error] GET /api/compose/${fragments}:`, error);
    return NextResponse.json(
      { error: "Failed to compose profile data" },
      { status: 500 }
    );
  }
}
