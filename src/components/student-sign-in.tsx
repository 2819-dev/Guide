"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { signInStudent } from "@/app/auth/sign-in/actions";
import { GuideWordmark } from "@/components/guide-logo";

type School = { id: string; name: string; slug: string };
type Step = "school" | "username" | "password" | "forgot" | "forgot-sent";

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
    // Remembering the school is optional.
  }
}

/**
 * Student log in, one thing at a time: school → username → password.
 * Accounts come from teachers; "Forgot password?" asks the student's
 * teachers for a new one.
 */
export function StudentSignIn() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("school");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState<School | null>(null);
  const [remembered, setRemembered] = useState<School | null>(null);
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [helpBusy, setHelpBusy] = useState(false);
  const [state, action, pending] = useActionState(signInStudent, null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/schools");
        const data = await res.json();
        if (cancelled) return;
        const list: School[] = data.schools ?? [];
        setSchools(list);
        setLoadError(!res.ok);
        const last = readLastSchool();
        if (last) setRemembered(list.find((s) => s.id === last.id) ?? null);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const q = query.trim().toLowerCase();
  const matches = q
    ? schools.filter((s) => s.name.toLowerCase().includes(q) || s.slug.includes(q))
    : [];

  function chooseSchool(s: School) {
    setSchool(s);
    saveLastSchool(s);
    setQuery("");
    setStep("username");
  }

  function back() {
    if (step === "school") router.push("/");
    else if (step === "username") setStep("school");
    else if (step === "password") setStep("username");
    else setStep("password");
  }

  async function askForHelp() {
    if (!school) return;
    setHelpBusy(true);
    await fetch("/api/student/password-help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: school.id, username }),
    }).catch(() => null);
    setHelpBusy(false);
    setStep("forgot-sent");
  }

  const heading = {
    school: "Find your school",
    username: "Enter your username",
    password: "Enter your password",
    forgot: "Forgot your password?",
    "forgot-sent": "Request sent",
  }[step];

  return (
    <div className="slogin">
      <button type="button" onClick={back} className="slogin__back" aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M13 8H3.5M7.5 3.5 3 8l4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      <div className="slogin__body">
        <GuideWordmark href={null} size="lg" className="slogin__mark" />
        <h1 className="slogin__title">{heading}</h1>
        {school && step !== "school" ? (
          <p className="slogin__context">
            {school.name}
            {step !== "username" && username ? ` · ${username}` : ""}
          </p>
        ) : null}

        {step === "school" && (
          <div className="slogin__stack">
            {remembered && !q ? (
              <button type="button" className="slogin__option" onClick={() => chooseSchool(remembered)}>
                <span>{remembered.name}</span>
                <span aria-hidden>→</span>
              </button>
            ) : null}
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="School name"
              aria-label="School name"
              className="field slogin__input"
              autoComplete="off"
            />
            <div aria-live="polite" className="slogin__stack">
              {loading ? null : loadError ? (
                <p className="slogin__note">Schools couldn’t be loaded. Refresh the page to try again.</p>
              ) : q && matches.length === 0 ? (
                <p className="slogin__note">No schools match. Check the spelling and try again.</p>
              ) : (
                matches.slice(0, 6).map((s) => (
                  <button key={s.id} type="button" className="slogin__option" onClick={() => chooseSchool(s)}>
                    <span>{s.name}</span>
                    <span aria-hidden>→</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === "username" && (
          <form
            className="slogin__stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (username.trim()) setStep("password");
            }}
          >
            <input
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              placeholder="Username"
              aria-label="Username"
              className="field slogin__input"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <button type="submit" className="btn-primary slogin__submit" disabled={!username.trim()}>
              Next
            </button>
          </form>
        )}

        {step === "password" && school && (
          <form action={action} className="slogin__stack">
            <input type="hidden" name="schoolId" value={school.id} />
            <input type="hidden" name="username" value={username} />
            <span className="relative block">
              <input
                ref={inputRef}
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                aria-label="Password"
                className="field slogin__input pr-20"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="slogin__show"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
            {state?.error ? (
              <p className="slogin__error" role="alert">
                {state.error}
              </p>
            ) : null}
            <button type="submit" className="btn-primary slogin__submit" disabled={pending}>
              {pending ? "Logging in…" : "Log in"}
            </button>
            <button type="button" className="slogin__link" onClick={() => setStep("forgot")}>
              Forgot password?
            </button>
          </form>
        )}

        {step === "forgot" && (
          <div className="slogin__stack">
            <p className="slogin__text">
              We’ll ask your teachers to set a new password for you.
            </p>
            <button
              type="button"
              className="btn-primary slogin__submit"
              onClick={() => void askForHelp()}
              disabled={helpBusy}
            >
              {helpBusy ? "Sending…" : "Ask my teachers"}
            </button>
          </div>
        )}

        {step === "forgot-sent" && (
          <div className="slogin__stack">
            <p className="slogin__text">
              Your teachers will give you a new password. Then come back and log in.
            </p>
            <button
              type="button"
              className="btn-primary slogin__submit"
              onClick={() => setStep("password")}
            >
              Back to log in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
