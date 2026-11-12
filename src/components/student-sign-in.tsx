"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { LoginMenu } from "@/components/login-menu";
import { loginAsCopy } from "@/lib/login-roles";
import { signInWithEmail } from "@/app/auth/sign-in/actions";

type School = { id: string; name: string; slug: string };

/** Student login: school typeahead → password only (no Badge login). */
export function StudentSignIn() {
  const copy = loginAsCopy("student");
  const [schools, setSchools] = useState<School[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState<School | null>(null);

  const [passState, passAction, passPending] = useActionState(
    signInWithEmail,
    null,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingSchools(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/schools");
        const data = await res.json();
        if (!cancelled) {
          setSchools(data.schools ?? []);
          if (!res.ok) setLoadError(data.error ?? "Could not load schools");
        }
      } catch {
        if (!cancelled) setLoadError("Could not load schools");
      } finally {
        if (!cancelled) setLoadingSchools(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = !q
    ? []
    : schools.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
      );

  function changeSchool() {
    setSchool(null);
    setQuery("");
  }

  return (
    <div className="login-split">
      <div className="login-split__visual" aria-hidden />

      <div className="login-split__panel">
        <div className="w-full max-w-[700px]">
          <h1 className="login-title">Log in with Guide</h1>
          <p className="mx-auto mt-2.5 max-w-md text-center text-[0.9375rem] leading-relaxed text-ink-muted">
            {!school
              ? copy.subtitle
              : "Use the username and password from your school."}
          </p>

          <div className="mt-9">
            {!school ? (
              <div className="mx-auto max-w-md space-y-4 rounded-[10px] bg-surface p-6 shadow-[var(--shadow-card)] sm:p-7">
                <label className="block text-sm font-semibold text-forest-900">
                  Find your school
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by school name"
                    className="field mt-1.5"
                    autoFocus
                  />
                </label>
                {loadingSchools && (
                  <p className="text-sm text-ink-muted">Loading schools…</p>
                )}
                {loadError && (
                  <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {loadError}
                  </p>
                )}
                {!loadingSchools && schools.length === 0 && !loadError && (
                  <div className="portal-empty !py-7">
                    <p className="portal-empty__title">No schools yet</p>
                    <p className="portal-empty__body">
                      Ask your teacher to apply for Guide. Once approved, your
                      school will show up here.
                    </p>
                  </div>
                )}
                {q ? (
                  <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-[10px] border border-line">
                    {filtered.length === 0 ? (
                      <li className="px-4 py-3.5 text-sm text-ink-muted">
                        No schools match that name.
                      </li>
                    ) : (
                      filtered.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSchool(s);
                              setQuery("");
                            }}
                            className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-base font-semibold text-forest-950 transition hover:bg-forest-100"
                          >
                            <span>{s.name}</span>
                            <span aria-hidden className="text-forest-600">
                              →
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-muted">
                    Start typing to find your school.
                  </p>
                )}
                <p className="text-center text-sm text-ink-muted">
                  Not a student?{" "}
                  <span className="inline-block align-middle">
                    <LoginMenu variant="nav" />
                  </span>
                  <span aria-hidden className="mx-1.5 text-forest-300">
                    ·
                  </span>
                  <Link
                    href="/auth/sign-in?as=official"
                    className="font-semibold text-forest-800"
                  >
                    Guide Official
                  </Link>
                </p>
              </div>
            ) : (
              <form
                action={passAction}
                className="mx-auto max-w-md space-y-4 rounded-[10px] bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-forest-950">
                    {school.name}
                  </span>
                  <button
                    type="button"
                    onClick={changeSchool}
                    className="font-semibold text-forest-800"
                  >
                    Change school
                  </button>
                </div>
                <input type="hidden" name="as" value="student" />
                <input type="hidden" name="schoolId" value={school.id} />
                <label className="block text-sm font-semibold text-forest-900">
                  Username
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="Your Guide email"
                    className="field mt-1.5"
                    autoFocus
                  />
                </label>
                <label className="block text-sm font-semibold text-forest-900">
                  Password
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="field mt-1.5"
                  />
                </label>
                {passState?.error && (
                  <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {passState.error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={passPending}
                  className="btn-primary w-full !py-3"
                >
                  {passPending ? "Signing in…" : "Log In"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="absolute bottom-4 right-4 text-xs text-ink-muted sm:right-6">
          Guide © 2026
        </p>
      </div>
    </div>
  );
}
