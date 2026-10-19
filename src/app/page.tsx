import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Soft hero — Clever-like airy masthead */}
      <section className="relative overflow-hidden bg-sky-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-16">
          <div>
            <p className="animate-rise hebrew text-lg font-medium text-forest-700 sm:text-xl">
              אלו מציאות
            </p>
            <h1 className="animate-rise-delay display mt-3 max-w-xl text-4xl text-forest-950 sm:text-5xl lg:text-[3.4rem]">
              The calm place to study{" "}
              <span className="whitespace-nowrap">Bava Metzia</span>
            </h1>
            <p className="animate-rise-late mt-5 max-w-lg text-lg text-ink-muted sm:text-xl">
              Open a daf, read the Gemara, and quiz yourself. After school,
              upload your notes for a second pass that feels personal — not
              overwhelming.
            </p>
            <div className="animate-rise-late mt-8 flex flex-wrap gap-3">
              <Link href="/study/21a" className="btn-primary">
                Start at דף כ״א ע״א
              </Link>
              <Link href="/study" className="btn-secondary">
                Browse dapim
              </Link>
            </div>
          </div>

          <div className="animate-rise-late relative">
            <div
              aria-hidden
              className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sun/70 float-soft"
            />
            <div
              aria-hidden
              className="absolute -bottom-6 -left-3 h-16 w-16 rounded-[1.5rem] bg-moss/50"
            />
            <div className="facet-frame relative bg-forest-800 p-6 text-forest-50 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-300">
                Tonight&apos;s page
              </p>
              <p className="hebrew mt-4 text-3xl text-white sm:text-4xl">
                בבא מציעא דף כ״א ע״א
              </p>
              <p className="mt-4 max-w-sm text-forest-100">
                Read Hebrew and English together, then check what stayed with
                you — from the daf or from your own notes.
              </p>
              <Link href="/study/21a" className="btn-light mt-6 inline-flex">
                Open this daf
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Audience tray — Clever puts the learner first */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 sm:grid-cols-2 sm:px-8">
          <Link
            href="/auth/sign-up"
            className="color-block bg-forest-700 text-white no-underline transition hover:bg-forest-600"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-forest-200">
              Students
            </p>
            <p className="display mt-2 text-2xl">Log in and keep learning</p>
            <p className="mt-2 text-forest-100">
              Study at home or on a school Chromebook. Your notes and quizzes
              stay with you.
            </p>
          </Link>
          <Link
            href="/auth/sign-up?role=rebbe"
            className="color-block border border-line bg-white text-forest-950 no-underline transition hover:border-forest-300"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-forest-600">
              Rebbeim
            </p>
            <p className="display mt-2 text-2xl">Guide for Education</p>
            <p className="mt-2 text-ink-muted">
              Invite students, then see dapim studied, quizzes taken, and notes
              submitted.
            </p>
          </Link>
        </div>
      </section>

      {/* What is Guide */}
      <section className="section-pad mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-600">
          What is Guide?
        </p>
        <h2 className="display mt-3 max-w-3xl text-3xl text-forest-950 sm:text-4xl">
          One calm study flow for אלו מציאות — and the rest of Bava Metzia.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          Built for real learners: clear pages, friendly quizzes, and a Rebbe
          panel that makes home learning visible without turning study into a
          dashboard.
        </p>
      </section>

      {/* Feature color blocks — modular Clever rhythm */}
      <section className="bg-paper pb-6">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:px-8 lg:grid-cols-3">
          <article className="color-block bg-forest-100">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-700 text-lg font-bold text-white">
              1
            </div>
            <h3 className="display text-2xl text-forest-950">Choose a daf</h3>
            <p className="mt-2 text-ink-muted">
              Browse בבא מציעא from 2a to 119b. אלו מציאות starts at דף כ״א —
              highlighted so you never wonder where to begin.
            </p>
          </article>
          <article className="color-block bg-moss/25">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-moss text-lg font-bold text-forest-950">
              2
            </div>
            <h3 className="display text-2xl text-forest-950">Read together</h3>
            <p className="mt-2 text-ink-muted">
              Hebrew and English side by side on a quiet page — room to think,
              not a wall of chrome.
            </p>
          </article>
          <article className="color-block bg-sun/35">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sun text-lg font-bold text-forest-950">
              3
            </div>
            <h3 className="display text-2xl text-forest-950">Quiz & notes</h3>
            <p className="mt-2 text-ink-muted">
              Check the daf, your notes, or both. After-school homework becomes
              a clear second pass.
            </p>
          </article>
        </div>
      </section>

      {/* Split story band */}
      <section className="section-pad mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="facet-frame bg-forest-900 p-8 text-white sm:p-10">
            <p className="hebrew text-2xl text-forest-200">למד. רשום. בדוק.</p>
            <p className="display mt-4 text-3xl sm:text-4xl">
              Study that feels inviting — not technical.
            </p>
            <p className="mt-4 text-forest-100">
              Soft color, clear steps, and room to breathe. Guide keeps the
              focus on the Gemara and on your notes.
            </p>
          </div>
          <div>
            <h2 className="display text-3xl text-forest-950 sm:text-4xl">
              Made for evenings after shiur
            </h2>
            <p className="mt-4 text-lg text-ink-muted">
              Paste tonight&apos;s notes, save them to your account, and get
              questions that follow what you actually wrote — alongside the
              page itself.
            </p>
            <ul className="mt-6 space-y-3 text-ink">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-forest-600" />
                Progress stays with your account across devices
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-moss" />
                Quizzes from the daf, notes, or mixed
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sun" />
                Rebbeim can see class activity without clutter
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Education CTA */}
      <section className="bg-forest-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-700">
              Guide for Education
            </p>
            <h2 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
              Rebbeim, see the learning that happens at home
            </h2>
            <p className="mt-3 text-lg text-ink-muted">
              Create a class, share an invite code, and follow dapim, quizzes,
              and notes — so Chromebook and after-school study stay connected to
              the classroom.
            </p>
          </div>
          <div className="shrink-0">
            <Link href="/auth/sign-up?role=rebbe" className="btn-primary">
              Join as a Rebbe
            </Link>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-pad mx-auto max-w-6xl text-center">
        <h2 className="display mx-auto max-w-2xl text-3xl text-forest-950 sm:text-4xl">
          Ready when you are
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-muted">
          Begin with אלו מציאות, or create an account so your notes and scores
          come along for the ride.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/study/21a" className="btn-primary">
            Begin studying
          </Link>
          <Link href="/auth/sign-up" className="btn-secondary">
            Get started free
          </Link>
        </div>
      </section>
    </div>
  );
}
