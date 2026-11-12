import Link from "next/link";

export const runtime = "edge";

export const metadata = { title: "TestQuiz preview" };

/** Static UI preview for design screenshots (no live game / no guests). */
export default function TestQuizPreviewPage() {
  return (
    <div className="tq-rise mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <p className="text-sm text-[var(--tq-muted)]">
        Design preview · not a live game
      </p>
      <h1 className="tq-brand mt-2">TestQuiz</h1>
      <p className="mt-2 max-w-xl text-[var(--tq-muted)]">
        Teachers host from the library. Students open TestQuiz from My apps and
        enter a PIN — Guide login required.
      </p>

      <section className="mt-10 rounded-3xl border border-white/10 bg-black/25 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--tq-muted)]">
          Join with PIN
        </p>
        <p className="tq-pin tq-pulse mt-3">482917</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="tq-choice tq-choice-a">Mitochondria</div>
          <div className="tq-choice tq-choice-b">Nucleus</div>
          <div className="tq-choice tq-choice-c">Ribosome</div>
          <div className="tq-choice tq-choice-d">Golgi</div>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <article className="tq-tile">
          <h2 className="text-lg font-bold">Cell parts review</h2>
          <p className="mt-1 text-sm text-[var(--tq-muted)]">8 questions</p>
          <div className="mt-4 flex gap-2">
            <span className="tq-btn tq-btn-ghost text-sm">Edit</span>
            <span className="tq-btn tq-btn-primary text-sm">Host</span>
          </div>
        </article>
        <article className="tq-tile">
          <h2 className="text-lg font-bold">Plan: Free</h2>
          <p className="mt-1 text-sm text-[var(--tq-muted)]">
            12 live games / month · 40 players · Quiz + True/False
          </p>
        </article>
      </section>

      <p className="mt-8 text-sm text-[var(--tq-muted)]">
        <Link href="/apps/testquiz/join" className="text-[var(--tq-accent)]">
          Open join
        </Link>
        {" · "}
        <Link href="/apps" className="text-[var(--tq-accent)]">
          Guide apps
        </Link>
      </p>
    </div>
  );
}
