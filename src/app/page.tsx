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
            <h1 className="display-hero max-w-[14ch]">
              Keep every student{" "}
              <span className="sun-underline">engaged</span>
            </h1>
            <p className="hero-lede">
              Clear classroom management for teachers, and learning apps that
              keep students involved — so school feels inviting and purposeful.
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
            managed. Teachers organize classes and learning apps. Students find
            a welcoming place for class work. Administrators apply; Guide
            Official reviews each school.
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
              Teachers create classes, assign apps, and follow progress from one
              place — so the school day stays organized. Students see only what
              their class needs.
            </p>
            <Link href="/education" className="clever-feature__link">
              Explore for schools
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
              Students open a calm, welcoming place for class — their apps and
              work together. Your school is ready after Guide Official approval.
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
              Place learning apps at the center of each student’s class space so
              the next lesson is clear and engaging. Messaging and Suggestions
              stay alongside, including {FIRST_APP_NAME} when your school adds
              it.
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
              Administrators apply once and invite teachers by email. The whole
              school meets students in the same inviting space. Developers
              partner with Guide only after Official review.
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
            Built for engaged students and well-run classrooms
          </h2>
          <Link href="/auth/sign-in?as=student" className="btn-light shrink-0">
            Log in as a student
          </Link>
        </div>
      </section>
    </div>
  );
}
