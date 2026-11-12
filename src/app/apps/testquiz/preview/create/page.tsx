export const runtime = "edge";

export const metadata = { title: "TestQuiz create preview" };

/** Static advanced editor mock for screenshots. */
export default function TestQuizCreatePreviewPage() {
  return (
    <div className="tq-rise mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--tq-muted)]">← Library</p>
        <div className="flex gap-2">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tq-muted)]">
            Questions · drag to reorder
          </p>
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
              <div>
                <span className="text-xs uppercase tracking-wide text-[var(--tq-muted)]">
                  {meta}
                </span>
                <div className="mt-1 text-sm font-semibold">{prompt}</div>
              </div>
            </div>
          ))}
        </aside>

        <section className="tq-panel space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-[rgba(62,207,142,0.15)] px-3 py-1 text-sm font-semibold text-[var(--tq-accent)]">
              Quiz
            </span>
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
            <div className="flex items-end pb-3 text-sm">Multi-select off</div>
          </div>
          <div className="space-y-2">
            {[
              ["A", "tq-choice-a", "Mitochondria", true],
              ["B", "tq-choice-b", "Nucleus", false],
              ["C", "tq-choice-c", "Ribosome", false],
              ["D", "tq-choice-d", "Golgi", false],
            ].map(([letter, cls, text, correct]) => (
              <div key={letter as string} className="flex gap-2">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${cls}`}
                >
                  {letter}
                </span>
                <div className="tq-input flex flex-1 items-center">{text as string}</div>
                <span className="flex items-center text-sm whitespace-nowrap">
                  {correct ? "✓ Correct" : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
