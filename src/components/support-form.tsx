"use client";

import { useState } from "react";

export function SupportForm() {
  const [category, setCategory] = useState("study");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
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
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSubject("");
      setBody("");
      setMessage(`Ticket ${data.ticket.ticketNumber} submitted.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel space-y-3">
      <h2 className="display text-2xl font-semibold text-forest-900">
        Get help
      </h2>
      <p className="text-sm text-ink-muted">
        Tell us what you need — we read every message.
      </p>
      <label className="block text-sm font-semibold text-forest-800">
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field mt-1"
        >
          <option value="study">Study</option>
          <option value="account">Account</option>
          <option value="education">Schools</option>
          <option value="billing">Billing</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="block text-sm font-semibold text-forest-800">
        Subject
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="field mt-1"
        />
      </label>
      <label className="block text-sm font-semibold text-forest-800">
        Details
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="field mt-1"
        />
      </label>
      <button
        type="button"
        disabled={busy || subject.length < 3 || body.length < 10}
        onClick={() => void submit()}
        className="btn-primary"
      >
        Submit ticket
      </button>
      {message && <p className="text-sm text-forest-700">{message}</p>}
    </div>
  );
}
