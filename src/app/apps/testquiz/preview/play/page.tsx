export const runtime = "edge";

export const metadata = { title: "TestQuiz play preview" };

/** Static student play mock for refine screenshots. */
export default function TestQuizPlayPreviewPage() {
  return (
    <div className="tq-rise mx-auto max-w-3xl px-4 py-6 sm:px-8">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-[var(--tq-muted)]">Cell parts review</span>
        <div className="flex items-center gap-2">
          <span className="tq-streak">Streak 3</span>
          <span className="font-bold tabular-nums">2450 pts</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="tq-timer-track mb-4" aria-hidden>
          <div className="tq-timer-fill" style={{ width: "62%" }} />
        </div>
        <p className="tq-kicker">Question 2 of 4 · Quiz</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Which organelle is known as the powerhouse of the cell?
        </h2>
        <div className="tq-choices mt-6">
          <button type="button" className="tq-choice tq-choice-a tq-choice-correct">
            Mitochondria
          </button>
          <button type="button" className="tq-choice tq-choice-b">
            Nucleus
          </button>
          <button type="button" className="tq-choice tq-choice-c">
            Ribosome
          </button>
          <button type="button" className="tq-choice tq-choice-d">
            Golgi
          </button>
        </div>
        <div className="tq-feedback tq-feedback-correct mt-6">
          <p className="text-2xl font-extrabold">Correct! +980</p>
          <p className="tq-streak mt-3">Streak 3</p>
        </div>
      </div>
    </div>
  );
}
