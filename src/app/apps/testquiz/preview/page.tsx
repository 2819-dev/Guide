import Link from "next/link";

export const runtime = "edge";

export const metadata = { title: "TestQuiz preview" };

/** Static UI preview hub for design screenshots. */
export default function TestQuizPreviewPage() {
  return (
    <div className="tq-rise mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <p className="tq-badge">Medium blue brand</p>
      <h1 className="tq-brand mt-3">TestQuiz</h1>
      <p className="mt-2 max-w-xl text-[var(--tq-muted)]">
        Design previews for create, host, play, and Discover. Live games still
        require Guide login + PIN.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/apps/testquiz/preview/create"
          className="tq-btn tq-btn-primary no-underline"
        >
          Create
        </Link>
        <Link
          href="/apps/testquiz/preview/host"
          className="tq-btn tq-btn-ghost no-underline"
        >
          Host
        </Link>
        <Link
          href="/apps/testquiz/preview/play"
          className="tq-btn tq-btn-ghost no-underline"
        >
          Play
        </Link>
        <Link
          href="/apps/testquiz/preview/discover"
          className="tq-btn tq-btn-ghost no-underline"
        >
          Discover
        </Link>
      </div>

      <section className="tq-panel mt-10 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--tq-muted)]">
          Join with PIN
        </p>
        <p className="tq-pin tq-pulse tq-glow mt-3">482917</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="tq-choice tq-choice-a">Mitochondria</div>
          <div className="tq-choice tq-choice-b">Nucleus</div>
          <div className="tq-choice tq-choice-c">Ribosome</div>
          <div className="tq-choice tq-choice-d">Golgi</div>
        </div>
      </section>
    </div>
  );
}
