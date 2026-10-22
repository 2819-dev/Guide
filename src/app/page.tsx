import Link from "next/link";
import { AmudHomePage } from "@/components/amud-home";
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
 * Cover + mid feature rows + closing band (footer is SiteFooter).
 */
function GuideHomePage() {
  const amudHref = amudPublicUrl() || appHomePath();

  return (
    <div className="guide-home">
      <section className="hero-band">
        <div className="content-band hero-band__grid">
          <div className="hero-copy">
            <h1 className="display-hero max-w-[16ch]">
              The{" "}
              <span className="sun-underline">identity</span> platform for
              schools
            </h1>
            <p className="hero-lede">
              Guide gives every school one secure identity — so students and
              teachers can open learning apps, message, and stay aligned.
            </p>

            <div className="hero-cta-stack">
              <Link href="/auth/sign-in?as=student" className="btn-hero-bar">
                <span>Log in as a student</span>
                <span className="btn-hero-bar__arrow">
                  <ArrowIcon />
                </span>
              </Link>

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
          </div>

          <div className="hero-visual-panel" aria-hidden>
            <p className="hero-visual-panel__caption">
              Classroom access, managed in one place.
            </p>
          </div>
        </div>
      </section>

      <section id="what" className="clever-intro">
        <div className="content-band clever-intro__inner">
          <h2 className="display-section">What is Guide?</h2>
          <p className="clever-intro__body">
            Guide is an identity platform built for schools. Students sign in
            once to reach their apps. Teachers manage classes after a school
            invite. Administrators apply; Guide Official reviews and approves.
          </p>
        </div>
      </section>

      <section className="clever-feature">
        <div className="content-band clever-feature__grid">
          <div
            className="clever-feature__visual clever-feature__visual--frame-a"
            aria-hidden
          >
            <div className="feature-scene feature-scene--classes">
              <span className="feature-scene__chip">Classes</span>
              <span className="feature-scene__chip">Apps</span>
              <span className="feature-scene__chip">Progress</span>
            </div>
            <span className="clever-feature__mark">01</span>
          </div>
          <div className="clever-feature__copy">
            <h2 className="display-feature">Power classroom learning</h2>
            <p className="clever-feature__body">
              Give teachers one place to create classes, assign apps, and follow
              progress. Students open everything from their portal — clearly,
              and without a crowded top bar.
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
            <h2 className="display-feature">Secure school identity</h2>
            <p className="clever-feature__body">
              Protect access across your school. Students choose their school,
              then sign in with a badge or password. School tools unlock after
              your school is approved.
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
              <span className="feature-scene__badge-label">Badge</span>
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
            <h2 className="display-feature">Apps at the center of the portal</h2>
            <p className="clever-feature__body">
              Teachers install learning apps on a class. Students find them in
              the center of their portal. Messaging and Suggestions stay
              alongside — including {FIRST_APP_NAME} when your school adds it.
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
            <h2 className="display-feature">One platform for the whole school</h2>
            <p className="clever-feature__body">
              Bring accounts, classes, and apps together in one place — so
              administrators stay in control and classrooms stay ready.
            </p>
            <Link href="/education#apply" className="clever-feature__link">
              Apply for your school
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

      <section className="clever-feature">
        <div className="content-band clever-feature__grid">
          <div
            className="clever-feature__visual clever-feature__visual--frame-e"
            aria-hidden
          >
            <div className="feature-scene feature-scene--secure">
              <span className="feature-scene__lock" />
              <span className="feature-scene__secure-label">Approved</span>
            </div>
            <span className="clever-feature__mark">05</span>
          </div>
          <div className="clever-feature__copy">
            <h2 className="display-feature">Built for school leadership</h2>
            <p className="clever-feature__body">
              School and district administrators apply once, then invite
              teachers by email. Verified developers partner with Guide after
              Official review.
            </p>
            <Link href="/schools/meeting" className="clever-feature__link">
              Book a meeting
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="content-band cta-band__inner">
          <h2 className="display-section cta-band__title">
            Connecting every student to the apps they need
          </h2>
          <Link href="/auth/sign-in?as=student" className="btn-light shrink-0">
            Log in as a student
          </Link>
        </div>
      </section>
    </div>
  );
}
