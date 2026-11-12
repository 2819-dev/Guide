export const runtime = "edge";

export const metadata = { title: "TestQuiz Discover preview" };

/** Static Discover mock for Kahoot-class screenshots. */
export default function TestQuizDiscoverPreviewPage() {
  return (
    <div className="tq-rise mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tq-badge">Discover</p>
          <h1 className="tq-brand mt-2">Find TestQuizzes</h1>
          <p className="mt-2 max-w-xl text-[var(--tq-muted)]">
            Browse quizzes teachers posted for schools. Preview, then copy into
            your library to host.
          </p>
        </div>
        <span className="tq-btn tq-btn-ghost">My library</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <div className="tq-input max-w-xs flex items-center text-[var(--tq-muted)]">
          Search title or description
        </div>
        <div className="tq-select max-w-[9rem] flex items-center">Science</div>
        <div className="tq-select max-w-[9rem] flex items-center">Newest</div>
        <span className="tq-btn tq-btn-primary">Search</span>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Cell parts review", "Science", "4 questions · by Jordan Lee", "12 copies"],
            ["Warm-up: True or False", "Icebreakers", "5 questions · by Maya Chen", "8 copies"],
            ["Class check-in", "Check-ins", "3 questions · by Sam Ortiz", "21 copies"],
            ["Fractions sprint", "Math", "6 questions · by Ava Kim", "5 copies"],
          ].map(([title, cat, meta, copies]) => (
            <article key={title} className="tq-tile flex flex-col">
              <div className="tq-cover-strip" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="tq-badge">{cat}</span>
                <span className="text-xs text-[var(--tq-muted)]">{copies}</span>
              </div>
              <h2 className="mt-2 text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm text-[var(--tq-muted)]">{meta}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <span className="tq-btn tq-btn-ghost text-sm">Preview</span>
                <span className="tq-btn tq-btn-primary text-sm">Use quiz</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="tq-panel h-fit space-y-3 p-5">
          <p className="tq-badge">Science</p>
          <h2 className="text-xl font-bold">Cell parts review</h2>
          <p className="text-sm text-[var(--tq-muted)]">by Jordan Lee</p>
          <p className="text-sm">
            Classic science quiz with mixed question types.
          </p>
          <ol className="space-y-2 text-sm">
            <li className="tq-soft px-3 py-2">
              <span className="text-xs text-[var(--tq-muted)]">1. Quiz · 20s</span>
              <div className="font-semibold">Powerhouse of the cell?</div>
            </li>
            <li className="tq-soft px-3 py-2">
              <span className="text-xs text-[var(--tq-muted)]">
                2. Type answer · 25s
              </span>
              <div className="font-semibold">Packages proteins for transport</div>
            </li>
          </ol>
          <span className="tq-btn tq-btn-primary w-full">Copy to my library</span>
        </aside>
      </div>
    </div>
  );
}
