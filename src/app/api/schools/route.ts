import { NextResponse } from "next/server";
import { listSchools } from "@/lib/schools";

export const runtime = 'edge';

/** Public list of approved schools for Clever-style student login. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const schools = await listSchools(q);
    return NextResponse.json({
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not load schools", schools: [] },
      { status: 500 },
    );
  }
}
