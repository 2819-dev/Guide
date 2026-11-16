import Link from "next/link";
import { AmudHomePage } from "@/components/amud-home";
import {
  QuizPreview,
  SchoolReviewPreview,
  StudentPhonePreview,
  StudentPortalPreview,
  TeacherClassesPreview,
} from "@/components/home-previews";
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

const FEATURES = [
  {
    eyebrow: "For teachers",
    title: "Run every class from one place",
    body: "Create classes, add the apps your students need, and see who is active today. Invite co-teachers by email — no IT ticket required.",
    link: { href: "/education", label: "See how schools use Guide" },
    Visual: TeacherClassesPreview,
  },
  {
    eyebrow: "For students",
    title: "One login. Everything for class.",
    body: "Students find their school, log in once, and land on a calm portal with their apps and messages from teachers. It works on a Chromebook, a tablet, or a phone.",
    link: { href: "/auth/sign-in?as=student", label: "Log in as a student" },
    Visual: StudentPhonePreview,
  },
  {
    eyebrow: "Learning apps",
    title: "Apps that keep attention",
    body: "Host a live TestQuiz in seconds, and add more learning apps as your school grows. Every app opens from the student's portal — no extra passwords.",
    link: { href: "/apps", label: "Browse the app library" },
    Visual: QuizPreview,
  },
  {
    eyebrow: "For administrators",
    title: "Set up your school in days, not months",
    body: "Apply once. Guide Official reviews every school before it goes live, then you invite your teachers and they add their classes.",
    link: { href: "/schools/meeting", label: "Book a meeting" },
    Visual: SchoolReviewPreview,
  },
];

const STEPS = [
  {
    n: "1",
    t: "Your school applies",
    d: "An administrator tells us about the school. It takes about five minutes.",
  },
  {
    n: "2",
    t: "Guide Official approves",
    d: "We review every school so students only ever meet trusted people and apps.",
  },
  {
    n: "3",
    t: "Teachers and students join",
    d: "Teachers accept their email invite. Students find their school and log in.",
  },
];

const AUDIENCES = [
  {
    t: "Students",
    d: "Log in to your school's portal.",
    href: "/auth/sign-in?as=student",
    cta: "Student log in",
  },
  {
    t: "Teachers",
    d: "Use the invite from your school.",
    href: "/auth/sign-in?as=educator",
    cta: "Teacher log in",
  },
  {
    t: "Administrators",
    d: "Bring Guide to your school.",
    href: "/education",
    cta: "Apply for your school",
  },
  {
    t: "Developers",
    d: "Put your app in front of classrooms.",
    href: "/developers/apply",
    cta: "Partner with Guide",
  },
];

/** Guide marketing home — Clever-style structure, Guide's forest brand. */
function GuideHomePage() {
  return (
    <div className="guide-home">
      <section className="gh-hero">
        <div className="content-band gh-hero__grid">
          <div className="gh-hero__copy">
            <h1 className="display-hero">
              Keep every student <span className="sun-underline">engaged</span>
            </h1>
            <p className="hero-lede">
              Guide gives teachers one place to run their classes and gives
              students one login for every learning app their school uses.
            </p>
            <div className="gh-hero__ctas">
              <Link href="/auth/sign-in?as=student" className="btn-hero-bar">
                <span>Log in as a student</span>
                <span className="btn-hero-bar__arrow">
                  <ArrowIcon />
                </span>
              </Link>
              <div className="gh-hero__secondary">
                <Link href="/education" className="btn-secondary">
                  For schools
                </Link>
                <Link href="/auth/sign-in?as=educator" className="gh-textlink">
                  Teacher log in <ArrowIcon size={14} />
                </Link>
              </div>
            </div>
          </div>
          <div className="gh-hero__visual">
            <StudentPortalPreview />
          </div>
        </div>
      </section>

      <section id="what" className="gh-steps">
        <div className="content-band">
          <div className="gh-section-head">
            <h2 className="display-section">What is Guide?</h2>
            <p className="gh-section-lede">
              A school platform for classroom management and learning apps.
              Every school is reviewed before it goes live.
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
              <f.Visual />
            </div>
            <div className="gh-feature__copy">
              <p className="eyebrow">{f.eyebrow}</p>
              <h2 className="display-feature mt-3">{f.title}</h2>
              <p className="clever-feature__body">{f.body}</p>
              <Link href={f.link.href} className="clever-feature__link">
                {f.link.label}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      ))}

      <section className="gh-audiences">
        <div className="content-band">
          <h2 className="display-feature text-center">Find your way in</h2>
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
              Apply in about five minutes, or talk with us first.
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
