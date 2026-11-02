"use client";

import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export function StudentSuggestionsPad() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/suggestions");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load");
        setItems(data.suggestions ?? []);
        setBlocked(Boolean(data.blocked));
        setReason(data.reason ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-ink-muted">Loading Suggestions…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (blocked) {
    return (
      <div className="portal-empty">
        <p className="portal-empty__title">Suggestions paused</p>
        <p className="portal-empty__body">
          {reason ??
            "Your teacher has paused Suggestions for now. Ask them if you need access."}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="portal-empty">
        <p className="portal-empty__title">No suggestions yet</p>
        <p className="portal-empty__body">
          When Guide Official posts something new, it shows up here — ideas and
          notes that keep school feeling inviting.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={s.id} className="portal-panel">
          <h2 className="text-lg font-semibold text-forest-950">{s.title}</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {new Date(s.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">
            {s.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
