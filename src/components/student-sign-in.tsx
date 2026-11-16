"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { signInWithEmail } from "@/app/auth/sign-in/actions";
import { GuideWordmark } from "@/components/guide-logo";
import { HeroStudentArt } from "@/components/home-illustrations";
import { LoginMenu } from "@/components/login-menu";
import { PhotoFrame } from "@/components/photo-frame";

type School = { id: string; name: string; slug: string };

const LAST_SCHOOL_KEY = "guide:last-school";

function readLastSchool(): School | null {
  try {
    const raw = window.localStorage.getItem(LAST_SCHOOL_KEY);
    return raw ? (JSON.parse(raw) as School) : null;
  } catch {
    return null;
  }
}

function saveLastSchool(school: School) {
  try {
    window.localStorage.setItem(LAST_SCHOOL_KEY, JSON.stringify(school));
  } catch {
    // Private mode / blocked storage — remembering the school is optional.
  }
}

/**
 * Student log in (Clever-style): find your school, then email + password.
 * Remembers the last school on this device so returning students skip search.
 */
export function StudentSignIn() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState<School | null>(null);
  const [remembered, setRemembered] = useState<School | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [state, action, pending] = useActionState(signInWithEmail, null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/schools");
        const data = await res.json();
        if (cancelled) return;
        const list: School[] = data.schools ?? [];
        setSchools(list);
        if (!res.ok) setLoadError("We couldn’t load schools. Refresh to try again.");
        // Only offer the remembered school if it's still on Guide.
        const last = readLastSchool();
        if (last) setRemembered(list.find((s) => s.id === last.id) ?? null);
      } catch {
        if (!cancelled) setLoadError("We couldn’t load schools. Refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? schools.filter(
        (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
      )
    : [];

  function choose(s: School) {
    setSchool(s);
    setQuery("");
    saveLastSchool(s);
  }

  return (
    <div className="student-login">
      <aside className="student-login__side" aria-hidden>
        <GuideWordmark href={null} tone="onDark" size="lg" />
        <div className="student-login__art">
          <PhotoFrame shape="pill" accent="sun">
            <HeroStudentArt />
          </PhotoFrame>
        </div>
        <p className="student-login__tagline">
          One login for every app your class uses.
        </p>
      </aside>

      <div className="student-login__main">
        <div className="student-login__top">
          <GuideWordmark href="/" size="md" />
          <Link href="/" className="student-login__home">
            ← Back to Guide
          </Link>
        </div>

        <div className="student-login__body">
          <p className="login-eyebrow">Student</p>
          <h1 className="login-title">Log in to Guide</h1>

          {!school ? (
            <div className="student-login__card">
              {remembered ? (
                <div className="student-login__remembered">
                  <p className="text-sm text-ink-muted">Welcome back</p>
                  <button
                    type="button"
                    className="student-login__school-btn"
                    onClick={() => choose(remembered)}
                  >
                    <span>{remembered.name}</span>
                    <span aria-hidden>→</span>
                  </button>
                  <p className="text-center text-sm text-ink-muted">
                    Not your school? Search below.
                  </p>
                </div>
              ) : null}

              <label className="block text-sm font-semibold text-forest-900" htmlFor="school-search">
                Find your school
              </label>
              <input
                id="school-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Start typing your school’s name"
                className="field"
                autoComplete="off"
                autoFocus={!remembered}
                aria-describedby="school-search-status"
              />

              <div id="school-search-status" aria-live="polite">
                {loading ? (
                  <p className="student-login__hint">Loading schools…</p>
                ) : loadError ? (
                  <p className="student-login__error">{loadError}</p>
                ) : schools.length === 0 ? (
                  <div className="student-login__empty">
                    <p className="font-semibold text-forest-950">No schools on Guide yet</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      When your school joins Guide, you’ll find it here. Your
                      teacher can tell you when it’s ready.
                    </p>
                  </div>
                ) : !q ? (
                  <p className="student-login__hint">
                    Type at least a few letters of your school’s name.
                  </p>
                ) : matches.length === 0 ? (
                  <div className="student-login__empty">
                    <p className="font-semibold text-forest-950">No school matches “{query.trim()}”</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Check the spelling, or ask your teacher whether your
                      school uses Guide.
                    </p>
                  </div>
                ) : (
                  <ul className="student-login__results" aria-label="Matching schools">
                    {matches.slice(0, 8).map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="student-login__school-btn"
                          onClick={() => choose(s)}
                        >
                          <span>{s.name}</span>
                          <span aria-hidden>→</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <form action={action} className="student-login__card">
              <div className="student-login__chosen">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Your school
                  </p>
                  <p className="truncate font-semibold text-forest-950">{school.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSchool(null)}
                  className="shrink-0 text-sm font-semibold text-forest-800 hover:underline"
                >
                  Change
                </button>
              </div>

              <input type="hidden" name="as" value="student" />
              <input type="hidden" name="schoolId" value={school.id} />

              <label className="block text-sm font-semibold text-forest-900">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  inputMode="email"
                  placeholder="you@example.com"
                  className="field mt-1.5"
                  autoFocus
                />
              </label>

              <label className="block text-sm font-semibold text-forest-900">
                Password
                <span className="relative mt-1.5 block">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="field pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-forest-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>

              {state?.error ? (
                <p className="student-login__error" role="alert">
                  {state.error}
                </p>
              ) : null}

              <button type="submit" disabled={pending} className="btn-primary w-full !py-3">
                {pending ? "Logging in…" : "Log in"}
              </button>

              <p className="text-center text-sm text-ink-muted">
                Forgot your password? Ask your teacher, or email{" "}
                <a href="mailto:hello@guidelearning.org" className="font-semibold text-forest-800 underline">
                  hello@guidelearning.org
                </a>
                .
              </p>
            </form>
          )}

          <div className="student-login__links">
            <p>
              New to Guide?{" "}
              <Link
                href="/auth/sign-up?as=student"
                className="font-semibold text-forest-800 hover:underline"
              >
                Create a student account
              </Link>
            </p>
            <div className="flex items-center justify-center gap-2">
              <span>Not a student?</span>
              <LoginMenu variant="nav" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
