"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EILU_METZIOS_START,
  listAllDafim,
  type DafRef,
} from "@/lib/daf";

type Props = {
  visitedIds?: string[];
};

export function DafPicker({ visitedIds }: Props) {
  const [query, setQuery] = useState("");
  const [focusEilu, setFocusEilu] = useState(true);
  const [visited, setVisited] = useState(() => new Set(visitedIds ?? []));
  const all = useMemo(() => listAllDafim(), []);

  useEffect(() => {
    if (visitedIds) return;
    void fetch("/api/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { progress?: { dafId: string }[] } | null) => {
        if (!data?.progress) return;
        setVisited(new Set(data.progress.map((p) => p.dafId)));
      })
      .catch(() => undefined);
  }, [visitedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((d) => {
      if (focusEilu && !d.isEiluMetzios) return false;
      if (!q) return true;
      return (
        d.id.includes(q) ||
        d.englishLabel.toLowerCase().includes(q) ||
        d.hebrewLabel.includes(query.trim())
      );
    });
  }, [all, focusEilu, query]);

  const byPage = useMemo(() => {
    const map = new Map<number, DafRef[]>();
    for (const daf of filtered) {
      const list = map.get(daf.page) ?? [];
      list.push(daf);
      map.set(daf.page, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold text-forest-800">
            Find a daf
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 21a or כ״א"
            className="w-full rounded-2xl border border-forest-800/15 bg-white/70 px-4 py-3 text-base text-ink outline-none ring-forest-500/30 focus:ring-2"
          />
        </label>
        <label className="mt-1 flex items-center gap-2 text-sm font-semibold text-forest-800 sm:mt-6">
          <input
            type="checkbox"
            checked={focusEilu}
            onChange={(e) => setFocusEilu(e.target.checked)}
            className="size-4 accent-forest-600"
          />
          אלו מציאות only ({EILU_METZIOS_START}a+)
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {byPage.map(([page, sides]) => (
          <div
            key={page}
            className="rounded-2xl border border-forest-800/10 bg-white/50 p-3 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="display text-lg font-semibold text-forest-900">
                Daf {page}
              </span>
              {page >= EILU_METZIOS_START && (
                <span className="hebrew text-xs text-forest-600">אלו מציאות</span>
              )}
            </div>
            <div className="flex gap-2">
              {sides.map((daf) => {
                const seen = visited.has(daf.id);
                return (
                  <Link
                    key={daf.id}
                    href={`/study/${daf.id}`}
                    className={`flex-1 rounded-xl px-3 py-3 text-center text-sm font-semibold no-underline transition ${
                      seen
                        ? "bg-forest-600 text-white"
                        : "bg-forest-100 text-forest-900 hover:bg-forest-200"
                    }`}
                  >
                    {daf.id}
                    <span className="mt-1 block hebrew text-xs opacity-80">
                      {daf.side === "a" ? "ע״א" : "ע״ב"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {byPage.length === 0 && (
        <p className="text-ink-soft">No dapim match that search.</p>
      )}
    </div>
  );
}
