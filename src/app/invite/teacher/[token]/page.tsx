import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBrandBanner } from "@/components/guide-brand-banner";
import { TeacherInviteAcceptForm } from "@/components/teacher-invite-accept-form";
import { getDb } from "@/lib/db";
import { teacherInvites } from "@/lib/schema";

export const runtime = "edge";

export const metadata = {
  title: "Teacher invite",
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
            <h1 className="display-feature mt-1">We couldn’t open this invite</h1>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
              Something went wrong on our end. Refresh the page in a few
              minutes, or log in if you already set up your account.
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
              {used ? "This invite was already used" : "This invite has expired"}
            </h1>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
              {used
                ? "Log in with the email and password you created."
                : "Invites expire after 14 days. Ask your school administrator to send a new one."}
            </p>
            <p className="mt-5 flex flex-wrap gap-3">
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
