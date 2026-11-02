import Link from "next/link";
import { AppWordmark } from "@/components/app-wordmark";
import { FIRST_APP_NAME } from "@/lib/apps";
import {
  guidePublicUrl,
  publicAmudHomePath,
  publicAmudLearnBase,
} from "@/lib/site";

const link =
  "text-sm font-medium text-ink-muted no-underline hover:text-forest-900";

/** Public Amud footer — quiet Learn + Log In; Guide for schools only as a text link. */
export function AmudFooter() {
  const home = publicAmudHomePath();
  const learn = publicAmudLearnBase();

  return (
    <footer className="border-t border-line bg-sky-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-3 sm:px-8 lg:py-14">
        <div>
          <AppWordmark name={FIRST_APP_NAME} href={home} size="md" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
            Mishnayos and Gemara — open a daf, Test Yourself, keep your notes.
            For everyone.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forest-700">
            Learn
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href={learn} className={link}>
                Choose what to learn
              </Link>
            </li>
            <li>
              <Link href={`${learn}/bava-metzia`} className={link}>
                Bava Metzia
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forest-700">
            Account
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/auth/sign-in?as=learner" className={link}>
                Log In
              </Link>
            </li>
            <li>
              <Link href="/auth/sign-up?as=learner" className={link}>
                Create account
              </Link>
            </li>
            <li>
              <a href={guidePublicUrl()} className={link}>
                Guide for schools
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-4 text-xs text-ink-muted sm:px-8">
          © 2026 {FIRST_APP_NAME}
        </p>
      </div>
    </footer>
  );
}
