export const runtime = "edge";

export const metadata = { title: "TestQuiz library preview" };

/** Static library mock for Kahoot-class screenshots. */
export default function TestQuizLibraryPreviewPage() {
  return (
    <div className="tq-rise mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="tq-hero-band flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tq-badge">TestQuiz</p>
          <h1 className="tq-brand mt-2">Quiz library</h1>
          <p className="mt-2 max-w-xl text-[var(--tq-muted)]">
            Build quizzes, host live PIN games, or pull ideas from Discover —
            Kahoot-class create and play for class.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tq-btn tq-btn-ghost">Discover</span>
          <span className="tq-btn tq-btn-ghost">Join</span>
          <span className="tq-btn tq-btn-ghost">Reports</span>
          <span className="tq-btn tq-btn-primary">Create quiz</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="tq-stat">
          <strong>Plus</strong>
          <span className="text-xs text-[var(--tq-muted)]">Your plan</span>
        </div>
        <div className="tq-stat">
          <strong>∞</strong>
          <span className="text-xs text-[var(--tq-muted)]">
            Live games left this month
          </span>
        </div>
        <div className="tq-stat">
          <strong>100</strong>
          <span className="text-xs text-[var(--tq-muted)]">Max players per game</span>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="tq-kicker">Starter templates</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["Quick review", "A short scored quiz to warm up the class."],
            ["True or false sprint", "Fast T/F checks for comprehension."],
            ["Exit ticket mix", "Poll + open check-in before the bell."],
          ].map(([title, blurb]) => (
            <div key={title} className="tq-tile">
              <div className="mb-2 h-1.5 w-12 rounded-full bg-[var(--tq-accent)]" />
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm text-[var(--tq-muted)]">{blurb}</p>
              <p className="mt-3 text-sm font-semibold text-[var(--tq-accent-deep)]">
                Use template →
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="tq-kicker">Your quizzes</h2>
          <div className="flex flex-wrap gap-2">
            <div className="tq-input max-w-[14rem] flex items-center text-[var(--tq-muted)]">
              Search quizzes
            </div>
            <div className="tq-select max-w-[9rem] flex items-center">All</div>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Cell parts review", "Science", "4 questions · Quiz, Type answer"],
            ["Warm-up T/F", "Icebreakers", "5 questions · True or false"],
            ["Exit ticket", "Check-ins", "3 questions · Poll, Open-ended"],
          ].map(([title, cat, meta]) => (
            <article key={title} className="tq-tile flex flex-col">
              <div className="tq-cover-strip" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="tq-badge">Discover</span>
                <span className="text-xs text-[var(--tq-muted)]">{cat}</span>
              </div>
              <h2 className="mt-2 text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm text-[var(--tq-muted)]">{meta}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <span className="tq-btn tq-btn-primary text-sm">Host</span>
                <span className="tq-btn tq-btn-ghost text-sm">Edit</span>
                <span className="tq-btn tq-btn-ghost text-sm">Duplicate</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
