export const runtime = "edge";

export const metadata = { title: "TestQuiz host preview" };

/** Static advanced host lobby mock for screenshots. */
export default function TestQuizHostPreviewPage() {
  return (
    <div className="tq-rise relative mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--tq-muted)]">Cell parts review</p>
          <h1 className="tq-brand">Lobby</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tq-btn tq-btn-ghost">Mute music</span>
          <span className="tq-btn tq-btn-danger">End game</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
        <div className="tq-panel p-8 text-center sm:p-10">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--tq-muted)]">
            Join with PIN
          </p>
          <p className="tq-pin tq-pulse tq-glow mt-4">482917</p>
          <p className="mt-4 text-[var(--tq-muted)]">
            Students open TestQuiz from My apps, then enter this PIN.
          </p>
          <div className="mt-8 flex flex-wrap items-start justify-center gap-8">
            <div className="tq-pop inline-block rounded-2xl bg-white p-2 shadow-lg">
              <div
                className="grid grid-cols-5 gap-1 rounded-xl bg-[#071a14] p-3"
                style={{ width: 168, height: 168 }}
                aria-hidden
              >
                {Array.from({ length: 25 }).map((_, i) => (
                  <span
                    key={i}
                    className="rounded-[2px]"
                    style={{
                      background:
                        (i * 7) % 3 === 0 ? "#f3faf6" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="max-w-xs text-left text-sm text-[var(--tq-muted)]">
              <p className="font-semibold text-[var(--tq-ink)]">Projector tip</p>
              <p className="mt-1">
                Keep this screen up. Students can scan the QR or type the PIN.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <span className="tq-btn tq-btn-primary min-w-[10rem] text-lg">
              Start game
            </span>
          </div>
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            {["Nicknames", "Avatars", "Music"].map((label) => (
              <div
                key={label}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-3 text-sm"
              >
                <span>{label}</span>
                <span className="text-[var(--tq-accent)]">On</span>
              </div>
            ))}
          </div>
        </div>
        <div className="tq-panel p-6">
          <h2 className="text-lg font-bold">
            Players <span className="text-[var(--tq-accent)]">(6)</span>
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[
              ["Maya", "#2d6a4f"],
              ["Jordan", "#1368ce"],
              ["Sam", "#d89e00"],
              ["Ava", "#e21b3c"],
              ["Leo", "#26890c"],
              ["Nina", "#3ecf8e"],
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
        </div>
      </div>
    </div>
  );
}
