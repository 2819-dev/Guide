"use client";

import { useState } from "react";

export function SupportForm() {
  const [category, setCategory] = useState("study");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ?? "Your request wasn’t sent. Try again in a moment.",
        );
      }
      setSubject("");
      setBody("");
      setMessage({
        ok: true,
        text: `Request ${data.ticket.ticketNumber} sent. The Guide team will follow up.`,
      });
    } catch (e) {
      setMessage({
        ok: false,
        text:
          e instanceof Error
            ? e.message
            : "Your request wasn’t sent. Try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="portal-panel space-y-4" aria-labelledby="get-help-title">
      <div>
        <h2
          id="get-help-title"
          className="text-lg font-semibold tracking-tight text-forest-950"
        >
          Get help
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Tell us what you need. The Guide team reviews every request.
        </p>
      </div>
      <label className="block text-sm font-semibold text-forest-900">
        Topic
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field mt-1.5"
        >
          <option value="account">Account and log in</option>
          <option value="education">Classes and school</option>
          <option value="study">Apps and learning</option>
          <option value="billing">Billing</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className="block text-sm font-semibold text-forest-900">
        Subject
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="field mt-1.5"
          placeholder="A short summary"
        />
      </label>
      <label className="block text-sm font-semibold text-forest-900">
        Details
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="field mt-1.5"
          placeholder="What happened, and what were you trying to do?"
        />
      </label>
      <button
        type="button"
        disabled={busy || subject.length < 3 || body.length < 10}
        onClick={() => void submit()}
        className="btn-primary"
      >
        {busy ? "Sending…" : "Send request"}
      </button>
      {message ? (
        <p
          className={`form-alert ${message.ok ? "form-alert--success" : "form-alert--error"}`}
          role={message.ok ? "status" : "alert"}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
