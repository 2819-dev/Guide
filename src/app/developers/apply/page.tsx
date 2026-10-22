import { DeveloperApplyForm } from "@/components/developer-apply-form";
import Link from "next/link";

export const runtime = "edge";

export const metadata = {
  title: "Apply as a developer · Guide",
  description:
    "Verified developer partners apply to Guide. Official review required.",
};

/**
 * Public apply form — no server session/DB on first paint.
 * Avoids 500 when Neon Auth/DB env is missing; logged-in redirect lives on /developer.
 */
export default function DeveloperApplyPage() {
  return (
    <div className="portal-page">
      <div className="content-band portal-page__inner max-w-2xl">
        <DeveloperApplyForm />
        <p className="mt-4 text-sm text-ink-muted">
          Already approved?{" "}
          <Link
            href="/auth/sign-in?as=developer"
            className="font-semibold text-forest-800"
          >
            Partner log in
          </Link>
          {" · "}
          Prefer an account first?{" "}
          <Link
            href="/auth/sign-up?as=developer"
            className="font-semibold text-forest-800"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
