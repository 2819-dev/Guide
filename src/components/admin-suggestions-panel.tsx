"use client";

import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  createdAt: string;
};

export function AdminSuggestionsPanel() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/suggestions");
    if (!res.ok) {
      setError("Could not load suggestions");
      return;
    }
    const data = await res.json();
    setItems(data.suggestions ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, published: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setTitle("");
      setBody("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        Posts appear in the student Suggestions pad (unless a teacher has paused
        access).
      </p>

      <div className="portal-panel space-y-3">
        <label className="block text-sm font-semibold text-forest-900">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="field mt-1.5"
            placeholder="Short title"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Suggestion
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="field mt-1.5"
            placeholder="What should students see?"
          />
        </label>
        <button
          type="button"
          disabled={busy || title.trim().length < 2 || body.trim().length < 4}
          onClick={() => void create()}
          className="btn-primary"
        >
          {busy ? "Publishing…" : "Publish suggestion"}
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">No suggestions yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="rounded-xl border border-line px-4 py-3">
              <p className="font-semibold text-forest-950">{s.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{s.body}</p>
              <p className="mt-2 text-xs text-ink-muted">
                {s.published ? "Published" : "Draft"} ·{" "}
                {new Date(s.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
