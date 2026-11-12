export const runtime = "edge";

export const metadata = { title: "TestQuiz create preview" };

/** Static editor mock for Kahoot-class screenshots. */
export default function TestQuizCreatePreviewPage() {
  return (
    <div className="tq-rise mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--tq-muted)]">← Library</p>
        <div className="flex flex-wrap gap-2">
          <span className="tq-btn tq-btn-ghost">Preview as player</span>
          <span className="tq-btn tq-btn-ghost">Save</span>
          <span className="tq-btn tq-btn-primary">Host live</span>
        </div>
      </div>

      <input
        className="tq-input mt-4 text-xl font-bold"
        readOnly
        defaultValue="Cell parts review"
        aria-label="Quiz title"
      />
      <p className="mt-2 text-sm text-[var(--tq-muted)]">
        Classic science quiz with mixed question types.
      </p>

      <div className="tq-panel mt-4 flex flex-wrap items-center gap-3 p-4">
        <span className="tq-badge">Science</span>
        <span className="text-sm text-[var(--tq-muted)]">Private to you</span>
        <span className="tq-btn tq-btn-ghost text-sm">Publish to Discover</span>
        <div className="ml-auto flex gap-3">
          <div className="tq-stat">
            <strong>4</strong>
            <span className="text-xs text-[var(--tq-muted)]">Questions</span>
          </div>
          <div className="tq-stat">
            <strong>~3m</strong>
            <span className="text-xs text-[var(--tq-muted)]">Est. play</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          <p className="tq-kicker px-1">Questions · drag to reorder</p>
          {[
            ["1. Quiz · 20s", "Which organelle is the powerhouse?"],
            ["2. Quiz · 20s", "Where is genetic material stored?"],
            ["3. Type answer · 25s", "Organelle that packages proteins…"],
            ["4. True or false · 15s", "Plant cells have a cell wall."],
          ].map(([meta, prompt], i) => (
            <div
              key={meta}
              className={`tq-tile flex items-start gap-2 ${i === 0 ? "ring-2 ring-[var(--tq-accent)]" : ""}`}
            >
              <span className="tq-drag-handle" aria-hidden>
                ⠿
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-xs uppercase tracking-wide text-[var(--tq-muted)]">
                  {meta}
                </span>
                <div className="mt-1 text-sm font-semibold">{prompt}</div>
              </div>
            </div>
          ))}
          <p className="tq-kicker px-1 pt-2">Add question</p>
          <div className="tq-type-grid">
            {["Quiz", "True or false", "Type answer", "Puzzle", "Poll", "Slider"].map(
              (t) => (
                <button key={t} type="button" className="tq-type-chip">
                  {t}
                </button>
              ),
            )}
          </div>
        </aside>

        <section className="tq-panel space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="tq-badge">Quiz</span>
            <div className="flex gap-2">
              <span className="tq-btn tq-btn-ghost text-sm">Duplicate</span>
              <span className="tq-btn tq-btn-danger text-sm">Delete</span>
            </div>
          </div>
          <p className="text-lg font-semibold">
            Which organelle is known as the powerhouse of the cell?
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-sm text-[var(--tq-muted)]">Time (sec)</p>
              <div className="tq-input flex items-center">20</div>
            </div>
            <div>
              <p className="mb-1 text-sm text-[var(--tq-muted)]">Points</p>
              <div className="tq-input flex items-center">1000</div>
            </div>
            <div className="flex items-end pb-3 text-sm text-[var(--tq-muted)]">
              Multi-select off
            </div>
          </div>
          <div className="space-y-2">
            {[
              ["tq-choice-a", "tq-shape-tri", "Mitochondria", true],
              ["tq-choice-b", "tq-shape-dia", "Nucleus", false],
              ["tq-choice-c", "tq-shape-cir", "Ribosome", false],
              ["tq-choice-d", "tq-shape-sq", "Golgi", false],
            ].map(([cls, shape, text, correct]) => (
              <div key={text as string} className="flex gap-2">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}
                  aria-hidden
                >
                  <span className={`tq-shape ${shape}`} />
                </span>
                <div className="tq-input flex flex-1 items-center">
                  {text as string}
                </div>
                <span className="flex min-w-[4.5rem] items-center text-sm font-semibold text-[var(--tq-accent-deep)]">
                  {correct ? "Correct" : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
