import { DeveloperApplyForm } from "@/components/developer-apply-form";
import { GuideBrandBanner } from "@/components/guide-brand-banner";
import {
  getDeveloperStatus,
  hasDeveloperAccess,
} from "@/lib/developer-access";
import { ensureProfile } from "@/lib/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const runtime = "edge";

export const metadata = {
  title: "Apply as a developer · Guide",
  description:
    "Verified developer partners apply to Guide. Official review required.",
};

export default async function DeveloperApplyPage() {
  const session = await ensureProfile().catch(() => null);
  if (session) {
    const ok = await hasDeveloperAccess(session.profile);
    if (ok) redirect("/developer");
    const status = await getDeveloperStatus(session.profile.id);
    if (status.status === "pending") {
      return (
        <div className="portal-page">
          <GuideBrandBanner variant="strip" />
          <div className="content-band portal-page__inner max-w-2xl">
            <div className="portal-panel">
              <p className="portal-eyebrow">Developers</p>
              <h1 className="display-feature mt-1">Application pending</h1>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
                {status.appName
                  ? `“${status.appName}” is under review.`
                  : "Your developer application is under review."}{" "}
                The developer portal unlocks after Guide Official verifies you.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="portal-page">
      <GuideBrandBanner variant="strip" priority />
      <div className="content-band portal-page__inner max-w-2xl">
        <DeveloperApplyForm
          defaultName={session?.profile.displayName ?? ""}
          defaultEmail={session?.user.email ?? ""}
        />
        {!session ? (
          <p className="mt-4 text-sm text-ink-muted">
            Prefer to create an account first?{" "}
            <Link
              href="/auth/sign-up?as=developer"
              className="font-semibold text-forest-800"
            >
              Create account
            </Link>{" "}
            then return to apply so approval unlocks your portal.
          </p>
        ) : null}
      </div>
    </div>
  );
}
