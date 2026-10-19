import Link from "next/link";
import { ensureProfile } from "@/lib/profile";

export const instant = false;

export default async function HomePage() {
  const session = await ensureProfile().catch(() => null);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="leaf-motion absolute inset-x-0 top-0 h-[min(92vh,760px)]"
          style={{
            background:
              "linear-gradient(165deg, #123024 0%, #1a4332 42%, #2d7052 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[min(92vh,760px)] opacity-40"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1400' height='900' viewBox='0 0 1400 900'%3E%3Cpath fill='%230a1a12' opacity='.35' d='M0 560c120-70 240-120 380-90s250 130 400 100 260-140 420-110 200 90 280 70v370H0z'/%3E%3Cpath fill='%231a4332' opacity='.5' d='M0 640c140-50 220-110 360-80s240 100 390 70 250-120 390-90 220 80 300 55v305H0z'/%3E%3C/svg%3E\")",
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
          }}
        />

        <div className="relative mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-6xl flex-col justify-end px-5 pb-16 pt-24 sm:px-8 sm:pb-24">
          <p className="animate-rise hebrew mb-3 text-2xl text-forest-200 sm:text-3xl">
            אלו מציאות
          </p>
          <h1 className="animate-rise-delay display text-5xl font-semibold leading-[1.02] text-white sm:text-7xl">
            Guide
          </h1>
          <p className="animate-rise-late mt-5 max-w-xl text-lg leading-relaxed text-forest-100 sm:text-xl">
            Study Bava Metzia with clarity — open a daf, read the Gemara, and
            quiz yourself. After school, upload your notes for a second pass.
          </p>
          <div className="animate-rise-late mt-8 flex flex-wrap gap-3">
            <Link href="/study/21a" className="btn-primary !bg-white !text-forest-900">
              Begin at דף כ״א ע״א
            </Link>
            {session ? (
              <Link
                href="/study"
                className="btn-secondary !border-white/50 !text-white hover:!bg-white/10"
              >
                Browse dapim
              </Link>
            ) : (
              <Link
                href="/auth/sign-up"
                className="btn-secondary !border-white/50 !text-white hover:!bg-white/10"
              >
                Create account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="display text-3xl font-semibold text-forest-900 sm:text-4xl">
          Built for steady learning
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          One daf at a time. Read, write your notes, then check what stayed with
          you — at home or on a school Chromebook.
        </p>
      </section>

      <section className="border-t border-line bg-forest-900 text-forest-100">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:grid-cols-3 sm:px-8">
          <div>
            <h3 className="display text-xl font-semibold text-white">Choose</h3>
            <p className="mt-2 text-forest-200">
              Open any daf of בבא מציעא. אלו מציאות begins at דף כ״א.
            </p>
          </div>
          <div>
            <h3 className="display text-xl font-semibold text-white">Read</h3>
            <p className="mt-2 text-forest-200">
              Hebrew and English together on a calm page for focused study.
            </p>
          </div>
          <div>
            <h3 className="display text-xl font-semibold text-white">Review</h3>
            <p className="mt-2 text-forest-200">
              Quiz from the daf, from your notes, or both — progress stays with
              your account.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="display text-3xl font-semibold text-forest-900">
          Guide for Education
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Rebbeim invite students, then see dapim studied, quizzes taken, and
          notes submitted — so home learning stays visible.
        </p>
        <div className="mt-6">
          {session?.profile.role === "rebbe" ? (
            <Link href="/education" className="btn-primary">
              Open Rebbe panel
            </Link>
          ) : (
            <Link href="/auth/sign-up?role=rebbe" className="btn-secondary">
              Join as a Rebbe
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
