import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBlitzTeacher } from "@/lib/blitz/billing-auth";
import { redeemPromoCode } from "@/lib/blitz/promo";

export const runtime = "edge";

export async function POST(request: Request) {
  const profile = await requireBlitzTeacher();
  if (!profile) {
    return NextResponse.json(
      { error: "Sign in with your teacher account to use a code." },
      { status: 403 },
    );
  }
  const parsed = z
    .object({ code: z.string().trim().min(1).max(60) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a code." }, { status: 400 });
  }
  try {
    const result = await redeemPromoCode(profile.id, parsed.data.code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[blitz promo redeem]", error);
    return NextResponse.json(
      { error: "Something went wrong applying that code. Try again." },
      { status: 500 },
    );
  }
}
