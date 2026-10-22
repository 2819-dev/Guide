import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBrandBanner } from "@/components/guide-brand-banner";
import { TeacherInviteAcceptForm } from "@/components/teacher-invite-accept-form";
import { getDb } from "@/lib/db";
import { teacherInvites } from "@/lib/schema";

export const runtime = "edge";

export const metadata = {
  title: "Teacher invite · Guide",
  description: "Set up your Guide teacher account from a school invite.",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function TeacherInvitePage({ params }: Props) {
  const { token } = await params;

  let invite: typeof teacherInvites.$inferSelect | null = null;
  let dbError = false;
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(teacherInvites)
      .where(eq(teacherInvites.token, token))
      .limit(1);
    invite = row ?? null;
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="portal-page">
        <GuideBrandBanner variant="strip" priority />
        <div className="content-band portal-page__inner max-w-lg">
          <div className="portal-panel">
            <p className="portal-eyebrow">Teacher invite</p>
            <h1 className="display-feature mt-1">Temporarily unavailable</h1>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
              We could not look up this invite right now. Try again shortly, or
              log in if you already set up your account.
            </p>
            <p className="mt-5">
              <Link
                href="/auth/sign-in?as=educator"
                className="btn-primary inline-flex"
              >
                Teacher log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) notFound();

  const expired = invite.expiresAt.getTime() < Date.now();
  const used = invite.status === "accepted";

  return (
    <div className="portal-page">
      <GuideBrandBanner variant="strip" priority />
      <div className="content-band portal-page__inner max-w-lg">
        {expired || used ? (
          <div className="portal-panel">
            <p className="portal-eyebrow">Teacher invite</p>
            <h1 className="display-feature mt-1">
              {used ? "Invite already used" : "Invite expired"}
            </h1>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
              {used
                ? "This setup link was already used. Log in with the account you created."
                : "Ask your school administrator to send a new invite."}
            </p>
            <p className="mt-5">
              <Link
                href="/auth/sign-in?as=educator"
                className="btn-primary inline-flex"
              >
                Teacher log in
              </Link>
            </p>
          </div>
        ) : (
          <TeacherInviteAcceptForm
            token={invite.token}
            email={invite.email}
            schoolName={invite.schoolName}
          />
        )}
      </div>
    </div>
  );
}
