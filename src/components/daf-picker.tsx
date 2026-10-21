"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listDafim, type DafRef } from "@/lib/daf";
import { studyPath, type Tractate } from "@/lib/tractates";

type Props = {
  tractate: Tractate;
  visitedIds?: string[];
  /** Override learn base (e.g. /amudsite/learn on Guide public Amud). */
  learnBase?: string;
};

export function DafPicker({ tractate, visitedIds, learnBase }: Props) {
  const [query, setQuery] = useState("");
  const hasFeatured = Boolean(tractate.featuredChapter);
  const [focusFeatured, setFocusFeatured] = useState(hasFeatured);
  const [visited, setVisited] = useState(() => new Set(visitedIds ?? []));
  const all = useMemo(() => listDafim(tractate), [tractate]);

  useEffect(() => {
    if (visitedIds) return;
    void fetch(`/api/progress?tractate=${encodeURIComponent(tractate.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { progress?: { dafId: string }[] } | null) => {
        if (!data?.progress) return;
        setVisited(new Set(data.progress.map((p) => p.dafId)));
      })
      .catch(() => undefined);
  }, [visitedIds, tractate.slug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((d) => {
      if (focusFeatured && hasFeatured && !d.isFeaturedChapter) return false;
      if (!q) return true;
      return (
        d.id.includes(q) ||
        d.englishLabel.toLowerCase().includes(q) ||
        d.hebrewLabel.includes(query.trim())
      );
    });
  }, [all, focusFeatured, hasFeatured, query]);

  const byPage = useMemo(() => {
    const map = new Map<number, DafRef[]>();
    for (const daf of filtered) {
      const list = map.get(daf.page) ?? [];
      list.push(daf);
      map.set(daf.page, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const featuredLabel = tractate.featuredChapter?.hebrew;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold text-forest-800">Find a daf</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 21a or כ״א"
            className="field"
          />
        </label>
        {hasFeatured && featuredLabel && (
          <label className="flex items-center gap-2 text-sm font-semibold text-forest-800">
            <input
              type="checkbox"
              checked={focusFeatured}
              onChange={(e) => setFocusFeatured(e.target.checked)}
              className="size-4 accent-forest-600"
            />
            {featuredLabel} only
          </label>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {byPage.map(([page, sides]) => (
          <div key={page} className="panel !p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-forest-900">
                דף {page}
              </span>
              {sides.some((d) => d.isFeaturedChapter) && featuredLabel && (
                <span className="hebrew text-xs text-forest-600">
                  {featuredLabel}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {sides.map((daf) => {
                const seen = visited.has(daf.id);
                return (
                  <Link
                    key={daf.id}
                    href={studyPath(tractate.slug, daf.id, learnBase)}
                    className={`flex-1 rounded-md px-3 py-2.5 text-center text-sm font-semibold no-underline transition ${
                      seen
                        ? "bg-forest-800 text-white"
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
        <p className="text-ink-muted">No dapim match that search.</p>
      )}
    </div>
  );
}
