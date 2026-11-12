export const runtime = "edge";

export const metadata = { title: "TestQuiz host preview" };

/** Static host lobby mock for Kahoot-class screenshots. */
export default function TestQuizHostPreviewPage() {
  return (
    <div className="tq-rise relative mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="tq-kicker">Cell parts review</p>
          <h1 className="tq-brand mt-1">Lobby</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tq-btn tq-btn-ghost">Mute music</span>
          <span className="tq-btn tq-btn-danger">End game</span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="tq-panel p-7 text-center sm:p-9">
          <p className="tq-kicker">Join with PIN</p>
          <p className="tq-pin tq-pulse mt-3">482917</p>
          <div className="mt-3 flex justify-center">
            <span className="tq-btn tq-btn-ghost text-sm">Copy PIN</span>
          </div>
          <p className="mt-3 text-sm text-[var(--tq-muted)]">
            Students open TestQuiz from My apps, then enter this PIN.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-6">
            <div className="rounded-xl border border-[var(--tq-line)] bg-white p-2">
              <div
                className="grid grid-cols-5 gap-1 rounded-lg bg-[#0f172a] p-3"
                style={{ width: 148, height: 148 }}
                aria-hidden
              >
                {Array.from({ length: 25 }).map((_, i) => (
                  <span
                    key={i}
                    className="rounded-[2px]"
                    style={{
                      background: (i * 7) % 3 === 0 ? "#eff6ff" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="max-w-[14rem] text-left text-sm text-[var(--tq-muted)]">
              <p className="font-semibold text-[var(--tq-ink)]">Projector tip</p>
              <p className="mt-1">
                Keep this screen up. Students can scan the QR or type the PIN.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="tq-stat">
                  <strong>6</strong>
                  <span className="text-xs text-[var(--tq-muted)]">Players</span>
                </div>
                <div className="tq-stat">
                  <strong>4</strong>
                  <span className="text-xs text-[var(--tq-muted)]">Questions</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <span className="tq-btn tq-btn-primary min-w-[10rem] text-base">
              Start game
            </span>
          </div>
          <div className="mt-7 grid gap-2 text-left sm:grid-cols-3">
            {["Nicknames", "Avatars", "Music"].map((label) => (
              <div
                key={label}
                className="tq-soft flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <span className="font-semibold">{label}</span>
                <span className="font-bold text-[var(--tq-accent-deep)]">On</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tq-panel p-5">
          <h2 className="text-lg font-bold">
            Players <span className="text-[var(--tq-accent-deep)]">(6)</span>
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[
              ["Maya", "#2563eb"],
              ["Jordan", "#1368ce"],
              ["Sam", "#ca8a04"],
              ["Ava", "#e11d48"],
              ["Leo", "#16a34a"],
              ["Nina", "#3b82f6"],
            ].map(([name, color]) => (
              <li key={name} className="tq-lobby-chip">
                <span
                  className="tq-avatar-dot"
                  style={{ background: color as string }}
                />
                <span>{name}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="tq-stat">
              <strong>6</strong>
              <span className="text-xs text-[var(--tq-muted)]">Ready</span>
            </div>
            <div className="tq-stat">
              <strong>4</strong>
              <span className="text-xs text-[var(--tq-muted)]">Questions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
