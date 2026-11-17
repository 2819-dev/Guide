import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBlitzOfficial } from "@/lib/blitz/billing-auth";
import { createPromoCode, listPromoCodes, setPromoActive } from "@/lib/blitz/promo";

export const runtime = "edge";

const forbidden = () =>
  NextResponse.json({ error: "Only Guide Officials can do this." }, { status: 403 });

const optionalPositiveInt = z
  .union([z.number().int().positive().max(1_000_000), z.null()])
  .optional()
  .transform((v) => v ?? null);

const optionalDate = z
  .union([z.string().min(1), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    // A bare date means "through the end of that day" (UTC).
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59Z` : v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    return d;
  });

const FIELD_LABEL: Record<string, string> = {
  code: "code",
  planId: "plan",
  durationDays: "days of access",
  percentOff: "percent off",
  discountDuration: "applies to",
  discountMonths: "months",
  maxRedemptions: "max redemptions",
  expiresAt: "expiry date",
  note: "note",
};

const CreateBody = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("upgrade"),
    code: z.string().trim().min(1).max(60),
    planId: z.enum(["plus", "ultra"]),
    durationDays: z.number().int().min(1).max(3650),
    maxRedemptions: optionalPositiveInt,
    expiresAt: optionalDate,
    note: z.string().max(300).optional(),
  }),
  z.object({
    kind: z.literal("discount"),
    code: z.string().trim().min(1).max(60),
    percentOff: z.number().int().min(1).max(100),
    discountDuration: z.enum(["once", "repeating", "forever"]),
    discountMonths: optionalPositiveInt,
    maxRedemptions: optionalPositiveInt,
    expiresAt: optionalDate,
    note: z.string().max(300).optional(),
  }),
]);

export async function GET() {
  if (!(await requireBlitzOfficial())) return forbidden();
  return NextResponse.json({ codes: await listPromoCodes() });
}

export async function POST(request: Request) {
  const official = await requireBlitzOfficial();
  if (!official) return forbidden();
  const parsed = CreateBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue ? `Check the ${FIELD_LABEL[String(issue.path[0] ?? "")] ?? "form"} field and try again.` : "That request wasn’t valid. Refresh the page and try again." },
      { status: 400 },
    );
  }
  try {
    const result = await createPromoCode(parsed.data, official.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error("[blitz admin promo]", error);
    return NextResponse.json({ error: "Could not create the code." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await requireBlitzOfficial())) return forbidden();
  const parsed = z
    .object({ id: z.string().uuid(), active: z.boolean() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That request wasn’t valid. Refresh the page and try again." }, { status: 400 });
  const result = await setPromoActive(parsed.data.id, parsed.data.active);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
