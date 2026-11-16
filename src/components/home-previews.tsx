/**
 * Coded product previews for the Guide homepage.
 * Decorative mock screens built from Guide's own tokens, so they stay crisp
 * at any size and follow light/dark mode. Names and numbers are sample data.
 */

function Chrome({
  children,
  url = "guidelearning.org/student",
}: {
  children: React.ReactNode;
  url?: string;
}) {
  return (
    <div className="pv-window">
      <div className="pv-window__bar">
        <span className="pv-window__dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="pv-window__url">{url}</span>
      </div>
      <div className="pv-window__body">{children}</div>
    </div>
  );
}

function AppMark({
  letter,
  tone,
}: {
  letter: string;
  tone: "green" | "blue" | "gold" | "plum";
}) {
  return <span className={`pv-mark pv-mark--${tone}`}>{letter}</span>;
}

/** Hero: the student portal a student sees after logging in. */
export function StudentPortalPreview() {
  return (
    <figure className="pv-figure" aria-label="Preview of the Guide student portal">
      <Chrome>
        <div className="pv-topbar">
          <span className="pv-wordmark">Guide</span>
          <span className="pv-topbar__nav">
            <span className="pv-topbar__active">My portal</span>
            <span>Messages</span>
            <span className="pv-avatar">MR</span>
          </span>
        </div>
        <div className="pv-pad">
          <p className="pv-eyebrow">Lincoln Day School · Grade 6</p>
          <p className="pv-h1">Good morning, Maya</p>

          <div className="pv-next">
            <div>
              <p className="pv-next__label">Up next · Period 2</p>
              <p className="pv-next__title">Fractions review — live quiz</p>
            </div>
            <span className="pv-btn">Join</span>
          </div>

          <p className="pv-section">My apps</p>
          <div className="pv-apps">
            {[
              { l: "T", n: "TestQuiz", t: "blue" as const, s: "Live now" },
              { l: "A", n: "Amud", t: "green" as const, s: "Daf 12a" },
              { l: "G", n: "Arcade", t: "gold" as const, s: "3 games" },
              { l: "R", n: "Reading", t: "plum" as const, s: "Ch. 4" },
            ].map((a) => (
              <div key={a.n} className="pv-app">
                <AppMark letter={a.l} tone={a.t} />
                <span className="pv-app__name">{a.n}</span>
                <span className="pv-app__sub">{a.s}</span>
              </div>
            ))}
          </div>
        </div>
      </Chrome>
    </figure>
  );
}

/** Feature 01: teacher classes panel. */
export function TeacherClassesPreview() {
  const rows = [
    { name: "Math · Period 2", students: 24, apps: 3, active: 22 },
    { name: "Science · Period 4", students: 27, apps: 2, active: 25 },
    { name: "Homeroom 6B", students: 19, apps: 4, active: 19 },
  ];
  return (
    <figure className="pv-figure" aria-label="Preview of a teacher's classes in Guide">
      <Chrome url="guidelearning.org/teacher">
        <div className="pv-pad">
          <div className="pv-row-between">
            <p className="pv-h2">My classes</p>
            <span className="pv-btn pv-btn--sm">+ New class</span>
          </div>
          <div className="pv-table">
            <div className="pv-table__head">
              <span>Class</span>
              <span>Students</span>
              <span>Active today</span>
            </div>
            {rows.map((r) => (
              <div key={r.name} className="pv-table__row">
                <span className="pv-table__name">
                  {r.name}
                  <small>{r.apps} apps</small>
                </span>
                <span>{r.students}</span>
                <span className="pv-meter">
                  <span
                    className="pv-meter__fill"
                    style={{ width: `${Math.round((r.active / r.students) * 100)}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
          <div className="pv-invite">
            <span className="pv-invite__dot" />
            Invite sent to j.alvarez@lincolnday.org
          </div>
        </div>
      </Chrome>
    </figure>
  );
}

/** Feature 02: student portal on a phone. */
export function StudentPhonePreview() {
  return (
    <figure className="pv-figure pv-figure--phone" aria-label="Preview of Guide on a student's phone">
      <div className="pv-phone">
        <div className="pv-phone__notch" />
        <div className="pv-phone__screen">
          <div className="pv-topbar pv-topbar--phone">
            <span className="pv-wordmark">Guide</span>
            <span className="pv-burger" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="pv-pad pv-pad--phone">
            <p className="pv-h1 pv-h1--phone">Hi, Maya</p>
            <div className="pv-msg">
              <p className="pv-msg__from">Mr. Cohen · Math</p>
              <p className="pv-msg__body">Great work on yesterday&apos;s quiz! Today we review fractions.</p>
            </div>
            <div className="pv-apps pv-apps--phone">
              {[
                { l: "T", n: "TestQuiz", t: "blue" as const },
                { l: "A", n: "Amud", t: "green" as const },
                { l: "G", n: "Arcade", t: "gold" as const },
                { l: "R", n: "Reading", t: "plum" as const },
              ].map((a) => (
                <div key={a.n} className="pv-app pv-app--phone">
                  <AppMark letter={a.l} tone={a.t} />
                  <span className="pv-app__name">{a.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

/** Feature 03: TestQuiz live question. */
export function QuizPreview() {
  const answers = [
    { t: "1/2", c: "pv-ans--a", pct: 18 },
    { t: "3/4", c: "pv-ans--b", pct: 64 },
    { t: "2/3", c: "pv-ans--c", pct: 12 },
    { t: "5/8", c: "pv-ans--d", pct: 6 },
  ];
  return (
    <figure className="pv-figure" aria-label="Preview of a live TestQuiz question">
      <Chrome url="guidelearning.org/apps/testquiz">
        <div className="pv-pad">
          <div className="pv-row-between">
            <span className="pv-pill">Question 4 of 10</span>
            <span className="pv-pill pv-pill--soft">22 of 24 answered</span>
          </div>
          <p className="pv-quiz-q">Which fraction is the largest?</p>
          <div className="pv-answers">
            {answers.map((a) => (
              <div key={a.t} className={`pv-ans ${a.c}`}>
                <span>{a.t}</span>
                <span className="pv-ans__pct">{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </Chrome>
    </figure>
  );
}

/** Feature 04: school application review. */
export function SchoolReviewPreview() {
  const steps = [
    { t: "Application submitted", d: "Oct 3", done: true },
    { t: "Reviewed by Guide Official", d: "Oct 5", done: true },
    { t: "School approved", d: "Oct 5", done: true },
    { t: "Teachers invited", d: "12 of 14 joined", done: false },
  ];
  return (
    <figure className="pv-figure" aria-label="Preview of a school's onboarding progress">
      <Chrome url="guidelearning.org/education/panel">
        <div className="pv-pad">
          <div className="pv-row-between">
            <div>
              <p className="pv-eyebrow">School administrator</p>
              <p className="pv-h2">Lincoln Day School</p>
            </div>
            <span className="pv-status">Approved</span>
          </div>
          <ol className="pv-steps">
            {steps.map((s) => (
              <li key={s.t} className={s.done ? "is-done" : ""}>
                <span className="pv-steps__dot" aria-hidden>
                  {s.done ? "✓" : ""}
                </span>
                <span className="pv-steps__t">{s.t}</span>
                <span className="pv-steps__d">{s.d}</span>
              </li>
            ))}
          </ol>
        </div>
      </Chrome>
    </figure>
  );
}
