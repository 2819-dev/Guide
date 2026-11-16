import Link from "next/link";
import { AmudHomePage } from "@/components/amud-home";
import { HeroReleasePanel } from "@/components/hero-release-panel";
import { FIRST_APP_NAME, appHomePath } from "@/lib/apps";
import { amudPublicUrl, isAmudSite } from "@/lib/site";

export const runtime = "edge";

export default function HomePage() {
  if (isAmudSite()) {
    return <AmudHomePage />;
  }
  return <GuideHomePage />;
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 8h9M8 3.5 12.5 8 8 12.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Guide marketing home — forest brand, Clever marketing structure.
 */
function GuideHomePage() {
  const amudHref = amudPublicUrl() || appHomePath();

  return (
    <div className="guide-home">
      <section className="hero-band">
        <div className="content-band hero-band__grid">
          {/* Primary band: copy + CTA share height with Official Release panel */}
          <div className="hero-primary">
            <h1 className="display-hero max-w-[16ch] lg:max-w-none">
              Keep every student{" "}
              <span className="sun-underline">engaged</span>
            </h1>
            <p className="hero-lede">
              Classes, learning apps, and teacher invites in one place — so
              classrooms stay organized and students stay involved.
            </p>

            <div className="hero-cta-stack">
              <Link href="/auth/sign-in?as=student" className="btn-hero-bar">
                <span>Log in as a student</span>
                <span className="btn-hero-bar__arrow">
                  <ArrowIcon />
                </span>
              </Link>
            </div>
          </div>

          <HeroReleasePanel />

          {/* Twin cards start at hero panel bottom */}
          <div className="hero-link-row">
            <Link href="/education" className="hero-link-card">
              <span className="hero-link-card__label">For schools</span>
              <span className="hero-link-card__arrow" aria-hidden>
                <ArrowIcon size={15} />
              </span>
            </Link>
            <Link href="/developers/apply" className="hero-link-card">
              <span className="hero-link-card__label">For developers</span>
              <span className="hero-link-card__arrow" aria-hidden>
                <ArrowIcon size={15} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section id="what" className="clever-intro">
        <div className="content-band clever-intro__inner">
          <h2 className="display-section">What is Guide?</h2>
          <p className="clever-intro__body">
            Guide helps schools keep students engaged and classrooms well
            managed. Teachers organize classes and apps; students open what
            they need for class; administrators apply for their school.
          </p>
        </div>
      </section>

      {/* Four mid rows — Clever home density: image L/R alternating */}
      <section className="clever-feature">
        <div className="content-band clever-feature__grid">
          <div
            className="clever-feature__visual clever-feature__visual--frame-a"
            aria-hidden
          >
            <div className="feature-scene feature-scene--classes">
              <span className="feature-scene__pane" />
              <span className="feature-scene__pane feature-scene__pane--mid" />
              <span className="feature-scene__pane feature-scene__pane--tall" />
            </div>
            <span className="clever-feature__mark">01</span>
          </div>
          <div className="clever-feature__copy">
            <h2 className="display-feature">Classroom management, made clear</h2>
            <p className="clever-feature__body">
              Teachers create classes, add learning apps, and follow progress
              from one place. Students see only what their class needs.
            </p>
            <Link href="/education" className="clever-feature__link">
              For schools
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="clever-feature clever-feature--alt">
        <div className="content-band clever-feature__grid clever-feature__grid--flip">
          <div className="clever-feature__copy">
            <h2 className="display-feature">School that feels inviting</h2>
            <p className="clever-feature__body">
              Students open a calm place for class — apps and work together in
              one view, so the next lesson is easy to find.
            </p>
            <Link
              href="/auth/sign-in?as=student"
              className="clever-feature__link"
            >
              Log in as a student
              <span aria-hidden>→</span>
            </Link>
          </div>
          <div
            className="clever-feature__visual clever-feature__visual--frame-b"
            aria-hidden
          >
            <div className="feature-scene feature-scene--badge">
              <span className="feature-scene__badge-ring" />
            </div>
            <span className="clever-feature__mark">02</span>
          </div>
        </div>
      </section>

      <section className="clever-feature">
        <div className="content-band clever-feature__grid">
          <div
            className="clever-feature__visual clever-feature__visual--frame-c"
            aria-hidden
          >
            <div className="feature-scene feature-scene--apps">
              <span className="feature-scene__tile" />
              <span className="feature-scene__tile" />
              <span className="feature-scene__tile" />
              <span className="feature-scene__tile" />
            </div>
            <span className="clever-feature__mark">03</span>
          </div>
          <div className="clever-feature__copy">
            <h2 className="display-feature">Apps that keep attention</h2>
            <p className="clever-feature__body">
              Learning apps sit at the center of each student’s class space.
              Messaging and Suggestions stay nearby, including {FIRST_APP_NAME}
              when your school adds it.
            </p>
            <a href={amudHref} className="clever-feature__link">
              Visit {FIRST_APP_NAME}
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      <section className="clever-feature clever-feature--alt">
        <div className="content-band clever-feature__grid clever-feature__grid--flip">
          <div className="clever-feature__copy">
            <h2 className="display-feature">Teachers and administrators, together</h2>
            <p className="clever-feature__body">
              Administrators apply for the school and invite teachers by email.
              Everyone meets students in the same calm space for class.
            </p>
            <Link href="/schools/meeting" className="clever-feature__link">
              Book a meeting
              <span aria-hidden>→</span>
            </Link>
          </div>
          <div
            className="clever-feature__visual clever-feature__visual--frame-d"
            aria-hidden
          >
            <div className="feature-scene feature-scene--teams">
              <span className="feature-scene__row" />
              <span className="feature-scene__row" />
              <span className="feature-scene__row feature-scene__row--accent" />
            </div>
            <span className="clever-feature__mark">04</span>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="content-band cta-band__inner">
          <h2 className="display-section cta-band__title">
            Engaged students and well-run classrooms
          </h2>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link href="/auth/sign-in?as=student" className="btn-light shrink-0">
              Log in as a student
            </Link>
            <Link
              href="/education"
              className="text-center text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
            >
              For schools →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
