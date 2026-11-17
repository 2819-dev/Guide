import Link from "next/link";
import { AmudHomePage } from "@/components/amud-home";
import {
  AdminSchoolArt,
  HeroStudentArt,
  QuizClassArt,
  StudentTabletArt,
  TeacherClassArt,
} from "@/components/home-illustrations";
import { PhotoFrame, type FrameAccent, type FrameShape } from "@/components/photo-frame";
import { isAmudSite } from "@/lib/site";

export const runtime = "edge";

export default function HomePage() {
  if (isAmudSite()) {
    return <AmudHomePage />;
  }
  return <GuideHomePage />;
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
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

type Feature = {
  eyebrow: string;
  title: string;
  body: string;
  link: { href: string; label: string };
  art: () => React.ReactElement;
  shape: FrameShape;
  accent: FrameAccent;
};

const FEATURES: Feature[] = [
  {
    eyebrow: "For teachers",
    title: "Run every class from one place",
    body: "Create classes, add your students, and choose the apps each class uses. Students see the apps you add as soon as they log in.",
    link: { href: "/education", label: "See how schools use Guide" },
    art: TeacherClassArt,
    shape: "leaf",
    accent: "sun",
  },
  {
    eyebrow: "For students",
    title: "One login for everything in class",
    body: "Students find their school, log in once, and see the apps their teachers have added, along with messages from their teachers. Guide works on Chromebooks, tablets, and phones.",
    link: { href: "/auth/sign-in?as=student", label: "Log in as a student" },
    art: StudentTabletArt,
    shape: "arch",
    accent: "mint",
  },
  {
    eyebrow: "Learning apps",
    title: "A growing library of learning apps",
    body: "Teachers add apps to a class, and students open them from their portal without another password. Blitz, for live classroom quizzes, is available now, with more apps on the way.",
    link: { href: "/apps", label: "Browse the app library" },
    art: QuizClassArt,
    shape: "blob",
    accent: "forest",
  },
  {
    eyebrow: "For school administrators",
    title: "Bring your whole school onto Guide",
    body: "Apply once. The Guide team reviews every school before it goes live. After approval, you invite your teachers and they set up their classes.",
    link: { href: "/schools/meeting", label: "Book a meeting" },
    art: AdminSchoolArt,
    shape: "petal",
    accent: "sun",
  },
];

const STEPS = [
  {
    n: "1",
    t: "Your school applies",
    d: "A school administrator submits a short application. It takes about five minutes.",
  },
  {
    n: "2",
    t: "Guide reviews the application",
    d: "The Guide team reviews each application and confirms the school before it goes live.",
  },
  {
    n: "3",
    t: "Teachers and students join",
    d: "Teachers accept their email invitation. Students find their school and log in.",
  },
];

const AUDIENCES = [
  {
    t: "Students",
    d: "Log in to your school’s portal.",
    href: "/auth/sign-in?as=student",
    cta: "Student log in",
  },
  {
    t: "Teachers",
    d: "Log in to manage your classes.",
    href: "/auth/sign-in?as=educator",
    cta: "Teacher log in",
  },
  {
    t: "School administrators",
    d: "Bring Guide to your school.",
    href: "/education",
    cta: "Apply for your school",
  },
  {
    t: "Developers",
    d: "Publish your app to schools on Guide.",
    href: "/developers/apply",
    cta: "Apply as a developer",
  },
];

/** Guide marketing home. */
function GuideHomePage() {
  return (
    <div className="guide-home">
      <section className="gh-hero">
        <div className="content-band gh-hero__grid">
          <div className="gh-hero__copy">
            <h1 className="display-hero">
              One <span className="sun-underline">login</span> for every app
              your school uses
            </h1>
            <p className="hero-lede">
              Students sign in once and open the apps their classes use.
              Teachers and school administrators manage classes and rosters in
              one place.
            </p>
            <div className="gh-hero__ctas">
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
          <div className="gh-hero__visual">
            <PhotoFrame shape="pill" accent="sun">
              <HeroStudentArt />
            </PhotoFrame>
          </div>
        </div>
      </section>

      <section id="what" className="gh-steps">
        <div className="content-band">
          <div className="gh-section-head">
            <h2 className="display-section">What is Guide?</h2>
            <p className="gh-section-lede">
              Guide is a school platform that brings classes, rosters, and
              learning apps together behind a single sign-in. Every school is
              reviewed before it goes live.
            </p>
          </div>
          <ol className="gh-steps__list">
            {STEPS.map((s) => (
              <li key={s.n} className="gh-step">
                <span className="gh-step__n">{s.n}</span>
                <p className="gh-step__t">{s.t}</p>
                <p className="gh-step__d">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {FEATURES.map((f, i) => (
        <section
          key={f.title}
          className={`gh-feature${i % 2 === 1 ? " gh-feature--alt" : ""}`}
        >
          <div
            className={`content-band gh-feature__grid${i % 2 === 1 ? " gh-feature__grid--flip" : ""}`}
          >
            <div className="gh-feature__visual">
              <PhotoFrame shape={f.shape} accent={f.accent}>
                <f.art />
              </PhotoFrame>
            </div>
            <div className="gh-feature__copy">
              <p className="eyebrow">{f.eyebrow}</p>
              <h2 className="display-feature mt-3">{f.title}</h2>
              <p className="clever-feature__body">{f.body}</p>
              <Link href={f.link.href} className="clever-feature__link">
                {f.link.label}
                <ArrowIcon size={14} />
              </Link>
            </div>
          </div>
        </section>
      ))}

      <section className="gh-audiences">
        <div className="content-band">
          <h2 className="display-feature text-center">Choose how you use Guide</h2>
          <ul className="gh-audiences__grid">
            {AUDIENCES.map((a) => (
              <li key={a.t}>
                <Link href={a.href} className="gh-audience">
                  <span className="gh-audience__t">{a.t}</span>
                  <span className="gh-audience__d">{a.d}</span>
                  <span className="gh-audience__cta">
                    {a.cta} <ArrowIcon size={14} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cta-band">
        <div className="content-band cta-band__inner">
          <div>
            <h2 className="display-section cta-band__title">
              Bring Guide to your school
            </h2>
            <p className="gh-cta__lede">
              Apply in about five minutes, or talk with our team first.
            </p>
          </div>
          <div className="gh-cta__buttons">
            <Link href="/education" className="btn-light">
              Apply for your school
            </Link>
            <Link href="/schools/meeting" className="gh-cta__ghost">
              Book a meeting
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
