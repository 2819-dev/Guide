import Link from "next/link";

export const runtime = "edge";

export const metadata = {
  title: "School demo · Guide",
  description:
    "Desktop and iPad demo of Guide for schools — teacher management oriented.",
};

/** Full desktop/iPad school demo. Narrow phones get a visit-on-desktop message. */
export default function SchoolDemoPage() {
  return (
    <div className="portal-page">

      <div className="demo-narrow-gate content-band">
        <p className="eyebrow">For schools</p>
        <h1 className="display-feature mx-auto mt-2 max-w-[18ch]">
          View the demo on desktop or iPad
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-muted">
          This walkthrough shows teacher management on a larger screen. Open
          Guide on a desktop or iPad to explore the demo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/schools/meeting" className="btn-primary">
            Book a meeting
          </Link>
          <Link href="/education#apply" className="btn-secondary">
            Apply for your school
          </Link>
        </div>
      </div>

      <div className="demo-desktop-stage content-band portal-page__inner">
        <header className="mb-8 max-w-2xl">
          <p className="eyebrow">For schools · Demo</p>
          <h1 className="display-feature mt-2">
            What your school gets in Guide
          </h1>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-muted">
            A teacher-management walkthrough — classes, apps, invites, and
            progress — the way administrators and teachers use Guide day to day.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-forest-800">
            <Link href="/schools/meeting">Book a meeting →</Link>
            <Link href="/education#apply">Apply for your school →</Link>
            <Link href="/auth/sign-in?as=educator">Teacher log in →</Link>
          </p>
        </header>

        <div className="demo-frame" aria-label="Guide school portal demo">
          <div className="demo-frame__chrome">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full bg-forest-400"
              aria-hidden
            />
            Guide · Teacher portal
          </div>
          <div className="demo-frame__tabs" aria-hidden>
            <span className="demo-frame__tab demo-frame__tab--on">Apps</span>
            <span className="demo-frame__tab">Classes</span>
            <span className="demo-frame__tab">Teachers</span>
            <span className="demo-frame__tab">Suggestions</span>
            <span className="demo-frame__tab">Messages</span>
          </div>
          <div className="demo-frame__body">
            <aside className="demo-frame__side">
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">
                This week
              </p>
              <ul className="mt-3 space-y-2 text-sm text-forest-950">
                <li className="rounded-[8px] bg-white px-3 py-2 border border-line">
                  3 classes active
                </li>
                <li className="rounded-[8px] bg-white px-3 py-2 border border-line">
                  2 apps installed
                </li>
                <li className="rounded-[8px] bg-white px-3 py-2 border border-line">
                  18 students joined
                </li>
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-ink-muted">
                Sample data for demonstration only.
              </p>
            </aside>
            <div className="demo-frame__main">
              <h2 className="text-lg font-semibold tracking-tight text-forest-950">
                Classes
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Create a class, share an invite code, add apps, and follow
                progress.
              </p>

              <div className="mt-5 rounded-[10px] border border-line">
                <div className="demo-class-row px-4">
                  <div>
                    <p className="font-semibold text-forest-950">
                      Period 3 · Grade 9
                    </p>
                    <p className="text-xs text-ink-muted">
                      Invite · 8F2K · Amud installed
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-forest-700">
                    12 students
                  </span>
                </div>
                <div className="demo-class-row px-4">
                  <div>
                    <p className="font-semibold text-forest-950">
                      Homeroom · Grade 7
                    </p>
                    <p className="text-xs text-ink-muted">
                      Invite · Q9LM · Amud installed
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-forest-700">
                    6 students
                  </span>
                </div>
                <div className="demo-class-row px-4">
                  <div>
                    <p className="font-semibold text-forest-950">
                      Enrichment cohort
                    </p>
                    <p className="text-xs text-ink-muted">
                      Invite · pending apps
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-forest-700">
                    0 students
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[10px] border border-line bg-sky-soft p-4">
                  <p className="text-sm font-semibold text-forest-950">
                    Invite teachers
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ink-muted">
                    Type work emails. Guide sends setup links — teachers log in
                    only.
                  </p>
                </div>
                <div className="rounded-[10px] border border-line bg-sky-soft p-4">
                  <p className="text-sm font-semibold text-forest-950">
                    Add apps to a class
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ink-muted">
                    Students see installed apps in the center of their portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/schools/meeting" className="btn-primary">
            Book a meeting
          </Link>
          <Link href="/education#apply" className="btn-secondary">
            Apply for your school
          </Link>
        </div>
      </div>
    </div>
  );
}
