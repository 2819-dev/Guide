"use client";

import { useState } from "react";

type Props = {
  schoolName: string | null;
  badgeCode: string | null;
  badgeReady: boolean;
  canActivate: boolean;
};

export function StudentBadgePanel({
  schoolName,
  badgeCode,
  badgeReady,
  canActivate,
}: Props) {
  const [code, setCode] = useState(badgeCode);
  const [ready, setReady] = useState(badgeReady);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function activate() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/student/badge", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not set up badge");
      setCode(data.badgeCode);
      setReady(true);
      setMessage("Badge login is ready. Use this code at student Log In.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not set up badge");
    } finally {
      setBusy(false);
    }
  }

  function printBadge() {
    if (!code) return;
    const w = window.open("", "_blank", "noopener,noreferrer,width=420,height=560");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Guide badge</title>
<style>
  body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f7f4;color:#0f2418}
  .card{width:280px;border:2px solid #1b4d33;border-radius:16px;padding:28px 20px;text-align:center;background:#fff}
  .brand{font-weight:600;letter-spacing:-0.03em;font-size:22px}
  .school{margin-top:8px;font-size:13px;color:#4a6356}
  .code{margin-top:28px;font-size:28px;font-weight:700;letter-spacing:0.18em}
  .hint{margin-top:18px;font-size:12px;color:#4a6356}
</style></head><body><div class="card">
  <div class="brand">Guide</div>
  <div class="school">${schoolName ? schoolName.replace(/</g, "") : "Student"}</div>
  <div class="code">${code}</div>
  <div class="hint">Scan or enter at student Log In</div>
</div><script>window.print()</script></body></html>`);
    w.document.close();
  }

  if (!schoolName && !canActivate) return null;

  return (
    <div className="panel space-y-3">
      <h2 className="display text-2xl font-semibold text-forest-900">
        School scan credential
      </h2>
      {schoolName && (
        <p className="text-sm text-ink-muted">School: {schoolName}</p>
      )}
      {code ? (
        <>
          <p className="font-mono text-2xl font-semibold tracking-[0.2em] text-forest-950">
            {code}
          </p>
          <p className="text-sm text-ink-muted">
            {ready
              ? "Use this scan code (or a printout) on Log in as a → Student → Badge."
              : "Scan code saved — activate it to use at student Log In."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={printBadge} className="btn-secondary">
              Print scan card
            </button>
            {!ready && canActivate && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void activate()}
                className="btn-primary"
              >
                {busy ? "Setting up…" : "Activate scan login"}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            Set up a Clever-style scan credential so you can log in by camera or
            typing a code. Separate from any Roles Guide Official assigns you.
          </p>
          {canActivate && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void activate()}
              className="btn-primary"
            >
              {busy ? "Setting up…" : "Create scan credential"}
            </button>
          )}
        </>
      )}
      {message && <p className="text-sm text-forest-700">{message}</p>}
    </div>
  );
}
