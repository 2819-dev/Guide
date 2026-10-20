"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { GuideWordmark } from "@/components/guide-logo";
import { LoginMenu } from "@/components/login-menu";
import { loginAsCopy } from "@/lib/login-roles";
import { signInStudentBadge, signInWithEmail } from "@/app/auth/sign-in/actions";

type School = { id: string; name: string; slug: string };
type Mode = "choose" | "password" | "badge";

type DetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

/** Clever district login: split visual + Badge | Password tiles. */
export function StudentSignIn() {
  const copy = loginAsCopy("student");
  const [schools, setSchools] = useState<School[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState<School | null>(null);
  const [mode, setMode] = useState<Mode>("choose");
  const [scanning, setScanning] = useState(false);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [passState, passAction, passPending] = useActionState(
    signInWithEmail,
    null,
  );
  const [badgeState, badgeAction, badgePending] = useActionState(
    signInStudentBadge,
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

  const stopScan = useCallback(() => {
    setScanning(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopScan(), [stopScan]);

  const filtered = schools.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  });

  async function startScan(onCode: (code: string) => void) {
    setScanHint(null);
    const Detector = (
      window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => DetectorLike;
      }
    ).BarcodeDetector;
    if (!Detector) {
      setScanHint(
        "Camera scanning isn’t available here. Enter your badge code below.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const detector = new Detector({
        formats: ["qr_code", "code_128", "code_39", "ean_13"],
      });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const codes = await detector.detect(video);
          const raw = codes[0]?.rawValue?.trim();
          if (raw) {
            onCode(raw);
            stopScan();
            return;
          }
        } catch {
          /* keep scanning */
        }
        requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      setScanHint("Could not open the camera. Enter your badge code instead.");
      stopScan();
    }
  }

  function changeSchool() {
    stopScan();
    setSchool(null);
    setMode("choose");
    setQuery("");
  }

  return (
    <div className="login-split">
      <div className="login-split__visual">
        <GuideWordmark href="/" size="lg" tone="onDark" />
      </div>

      <div className="login-split__panel relative">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-5">
          <Link
            href="/auth/sign-in?as=official"
            className="inline-flex items-center gap-1.5 rounded-full border border-forest-400 bg-surface px-3 py-1.5 text-xs font-semibold text-forest-800 no-underline"
          >
            Official
          </Link>
        </div>

        <div className="w-full max-w-[700px]">
          <h1 className="text-center text-[2.25rem] font-semibold tracking-tight text-forest-950">
            Log in with Guide
          </h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-muted">
            {!school
              ? copy.subtitle
              : mode === "choose"
                ? `${school.name} · How do you want to log in?`
                : mode === "badge"
                  ? "Scan your badge or enter the code from your teacher."
                  : "Use the username and password from your school."}
          </p>

          <div className="mt-10">
            {!school ? (
              <div className="mx-auto max-w-md space-y-4 rounded-[10px] bg-surface p-6 shadow-[var(--shadow-card)]">
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
                  <div className="rounded-[10px] border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
                    <p className="font-semibold text-forest-900">
                      No schools yet
                    </p>
                    <p className="mt-2">
                      Ask your teacher to apply for Guide for Education. Once
                      approved, your school will show up here.
                    </p>
                  </div>
                )}
                <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-[10px] border border-line">
                  {filtered.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSchool(s);
                          setMode("choose");
                          setQuery("");
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-base font-semibold text-forest-950 transition hover:bg-forest-100"
                      >
                        <span>{s.name}</span>
                        <span aria-hidden className="text-forest-600">
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-center text-sm text-ink-muted">
                  Not a student?{" "}
                  <span className="inline-block align-middle">
                    <LoginMenu variant="nav" />
                  </span>
                </p>
              </div>
            ) : mode === "choose" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 text-sm">
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
                <div className="flex flex-col items-center justify-center gap-10 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setMode("badge")}
                    className="login-tile"
                  >
                    <div className="login-tile__art">
                      <div className="grid h-36 w-36 place-items-center rounded-[8px] border-2 border-forest-900 bg-paper">
                        <svg
                          width="72"
                          height="72"
                          viewBox="0 0 72 72"
                          aria-hidden
                        >
                          <rect
                            x="8"
                            y="8"
                            width="22"
                            height="22"
                            fill="currentColor"
                            className="text-forest-950"
                          />
                          <rect
                            x="42"
                            y="8"
                            width="22"
                            height="22"
                            fill="currentColor"
                            className="text-forest-950"
                          />
                          <rect
                            x="8"
                            y="42"
                            width="22"
                            height="22"
                            fill="currentColor"
                            className="text-forest-950"
                          />
                          <rect
                            x="42"
                            y="42"
                            width="10"
                            height="10"
                            fill="currentColor"
                            className="text-forest-950"
                          />
                          <rect
                            x="54"
                            y="54"
                            width="10"
                            height="10"
                            fill="currentColor"
                            className="text-forest-950"
                          />
                        </svg>
                      </div>
                    </div>
                    <span className="btn-primary mt-4 w-full !py-3">Badge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("password")}
                    className="login-tile"
                  >
                    <div className="login-tile__art">
                      <GuideWordmark href={null} size="lg" />
                    </div>
                    <span className="btn-secondary mt-4 w-full !py-3">
                      Password
                    </span>
                  </button>
                </div>
              </div>
            ) : mode === "password" ? (
              <form
                action={passAction}
                className="mx-auto max-w-md space-y-4 rounded-[10px] bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <button
                  type="button"
                  onClick={() => {
                    stopScan();
                    setMode("choose");
                  }}
                  className="text-sm font-semibold text-forest-800"
                >
                  ← Badge or Password
                </button>
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
            ) : (
              <form
                action={badgeAction}
                className="mx-auto max-w-md space-y-4 rounded-[10px] bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <button
                  type="button"
                  onClick={() => {
                    stopScan();
                    setMode("choose");
                  }}
                  className="text-sm font-semibold text-forest-800"
                >
                  ← Badge or Password
                </button>
                <input type="hidden" name="schoolId" value={school.id} />
                <button
                  type="button"
                  onClick={() =>
                    void startScan((code) => {
                      const input = document.getElementById(
                        "badge-code-input",
                      ) as HTMLInputElement | null;
                      if (input) {
                        input.value = code;
                        input.form?.requestSubmit();
                      }
                    })
                  }
                  className="btn-primary w-full !py-3"
                >
                  {scanning ? "Scanning…" : "Open camera"}
                </button>
                {scanning && (
                  <div className="overflow-hidden rounded-[10px] border border-line bg-forest-950">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={stopScan}
                      className="w-full py-2 text-sm font-semibold text-white"
                    >
                      Stop camera
                    </button>
                  </div>
                )}
                {scanHint && (
                  <p className="text-sm text-ink-muted">{scanHint}</p>
                )}
                <label className="block text-sm font-semibold text-forest-900">
                  Or enter badge code
                  <input
                    id="badge-code-input"
                    name="badgeCode"
                    required
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="e.g. AB12CD34"
                    className="field mt-1.5 uppercase tracking-wider"
                  />
                </label>
                {badgeState?.error && (
                  <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {badgeState.error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={badgePending}
                  className="btn-secondary w-full !py-3"
                >
                  {badgePending ? "Signing in…" : "Log in with badge code"}
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
