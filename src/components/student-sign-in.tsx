"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { loginAsCopy } from "@/lib/login-roles";
import { signInStudentBadge, signInWithEmail } from "@/app/auth/sign-in/actions";

type School = { id: string; name: string; slug: string };
type Mode = "choose" | "password" | "badge";

type DetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

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

  const subtitle = !school
    ? copy.subtitle
    : mode === "choose"
      ? "How do you want to log in?"
      : mode === "badge"
        ? "Scan your badge or enter the code from your teacher."
        : "Use the username and password from your school.";

  return (
    <AuthCard
      title={copy.title}
      subtitle={subtitle}
      footer={
        copy.joinHref && copy.joinLabel ? (
          <>
            New here?{" "}
            <Link
              href={copy.joinHref}
              className="font-semibold text-forest-800"
            >
              {copy.joinLabel}
            </Link>
          </>
        ) : null
      }
    >
      {!school ? (
        <div className="space-y-4">
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
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {loadError}
            </p>
          )}
          {!loadingSchools && schools.length === 0 && !loadError && (
            <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm leading-relaxed text-ink-muted">
              <p className="font-semibold text-forest-900">
                No schools yet
              </p>
              <p className="mt-2">
                Ask your teacher to apply for Guide for Education. Once
                approved, your school will show up here.
              </p>
            </div>
          )}
          {!loadingSchools && schools.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-ink-muted">
              No schools match “{query.trim()}”.
            </p>
          )}
          <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-xl border border-line">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSchool(s);
                    setMode("choose");
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[0.95rem] font-semibold text-forest-950 transition hover:bg-forest-100"
                >
                  <span>{s.name}</span>
                  <span aria-hidden className="text-forest-600">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-700">
                School
              </p>
              <p className="mt-0.5 font-semibold text-forest-950">
                {school.name}
              </p>
            </div>
            <button
              type="button"
              onClick={changeSchool}
              className="text-sm font-semibold text-forest-800"
            >
              Change
            </button>
          </div>

          {mode === "choose" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("badge")}
                className="group flex flex-col items-start rounded-2xl border border-line bg-sky-soft/40 px-4 py-5 text-left transition hover:border-forest-400 hover:bg-forest-100"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-forest-700">
                  Badge
                </span>
                <span className="mt-2 text-base font-semibold text-forest-950">
                  Scan or enter code
                </span>
                <span className="mt-1 text-sm text-ink-muted">
                  Hold your badge to the camera
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode("password")}
                className="group flex flex-col items-start rounded-2xl border border-line bg-surface px-4 py-5 text-left transition hover:border-forest-400 hover:bg-forest-100"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-forest-700">
                  Password
                </span>
                <span className="mt-2 text-base font-semibold text-forest-950">
                  Username & password
                </span>
                <span className="mt-1 text-sm text-ink-muted">
                  Use your Guide email
                </span>
              </button>
            </div>
          ) : null}

          {mode === "password" ? (
            <form action={passAction} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  stopScan();
                  setMode("choose");
                }}
                className="text-sm font-semibold text-forest-800"
              >
                ← All login options
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
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
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
          ) : null}

          {mode === "badge" ? (
            <form action={badgeAction} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  stopScan();
                  setMode("choose");
                }}
                className="text-sm font-semibold text-forest-800"
              >
                ← All login options
              </button>
              <input type="hidden" name="schoolId" value={school.id} />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-forest-900">
                  Scan your badge
                </p>
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
                  <div className="overflow-hidden rounded-xl border border-line bg-forest-950">
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
              </div>

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
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
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
          ) : null}
        </div>
      )}
    </AuthCard>
  );
}
