"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Squiggle, TileSymbol } from "@/components/blitz/brand";
import { BLITZ_DISCOVER_CATEGORIES, categoryLabel } from "@/lib/blitz/discover";
import { BLITZ_TYPE_LABEL } from "@/lib/blitz/types";
import type { BlitzDiscoverCard, BlitzDocument, BlitzQuestionType } from "@/lib/blitz/types";

const NEON = ["var(--bz-lime)", "var(--bz-coral)", "var(--bz-cyan)", "var(--bz-sun)", "var(--bz-violet)", "var(--bz-mint)"];

function hashIndex(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

export function BlitzDiscoverPanel() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [quizzes, setQuizzes] = useState<BlitzDiscoverCard[] | null>(null);
  const [preview, setPreview] = useState<(BlitzDocument & { ownerDisplayName: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    params.set("sort", sort);
    const res = await fetch(`/api/blitz/discover?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load Discover");
      setQuizzes([]);
      return;
    }
    setQuizzes(data.quizzes ?? []);
  }, [query, category, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openPreview(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/blitz/discover/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      setPreview(data.quiz);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyQuiz(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/blitz/discover/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not copy");
      router.push(`/apps/blitz/edit/${data.quiz.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not copy");
      setBusy(false);
    }
  }

  return (
    <div className="bz-page">
      <p className="bz-kicker">Discover</p>
      <h1 className="bz-h1 mt-2">
        Steal{" "}
        <span className="bz-mark">
          good ideas
          <Squiggle color="var(--bz-cyan)" />
        </span>
        .
      </h1>
      <p className="bz-muted mt-4" style={{ maxWidth: 560, fontSize: "1.05rem" }}>
        Blitzes other teachers shared. Preview one, copy it into your library, make it yours.
      </p>

      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q);
        }}
      >
        <input className="bz-input" style={{ maxWidth: 380 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photosynthesis, fractions, the 1920s…" aria-label="Search Discover" />
        <button type="submit" className="bz-btn bz-btn--primary">
          Search
        </button>
        <div className="bz-seg" style={{ marginLeft: "auto" }}>
          <button type="button" aria-pressed={sort === "recent"} onClick={() => setSort("recent")}>
            Newest
          </button>
          <button type="button" aria-pressed={sort === "popular"} onClick={() => setSort("popular")}>
            Most copied
          </button>
        </div>
      </form>

      <div className="bz-filters mt-4" role="group" aria-label="Categories">
        <button type="button" className="bz-filter" aria-pressed={category === ""} onClick={() => setCategory("")}>
          Everything
        </button>
        {BLITZ_DISCOVER_CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="bz-filter" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {error ? <p className="bz-alert mt-4">{error}</p> : null}

      <div className="mt-6">
        {quizzes === null ? (
          <p className="bz-muted">Loading…</p>
        ) : quizzes.length === 0 ? (
          <div className="bz-empty">
            <TileSymbol index={2} size={48} className="text-[var(--bz-cyan)]" />
            <p className="bz-h3" style={{ color: "var(--bz-text)" }}>
              Nothing here yet
            </p>
            <p>Be the first: open a quiz in the editor → Settings → Publish to Discover.</p>
          </div>
        ) : (
          <div className="bz-quiz-grid">
            {quizzes.map((item) => {
              const ci = hashIndex(item.id, NEON.length);
              return (
                <article key={item.id} className="bz-card bz-quiz">
                  <div className="bz-cover" style={{ "--cv": NEON[ci] } as CSSProperties}>
                    <span className="bz-cover-sym">
                      <TileSymbol index={ci} size={58} />
                    </span>
                    <span className="bz-cover-sym">
                      <TileSymbol index={ci + 1} size={84} />
                    </span>
                    <span className="bz-cover-sym">
                      <TileSymbol index={ci + 2} size={40} />
                    </span>
                    <span className="bz-cover-count">{item.questionCount} Qs</span>
                  </div>
                  <div className="bz-quiz-body">
                    <h3 className="bz-quiz-title">{item.title}</h3>
                    <p className="bz-faint">by {item.ownerDisplayName} · copied {item.copyCount}×</p>
                    <div className="bz-quiz-meta">
                      <span className="bz-chip">{categoryLabel(item.category)}</span>
                      {item.types.slice(0, 2).map((t) => (
                        <span key={t} className="bz-chip">
                          {BLITZ_TYPE_LABEL[t as BlitzQuestionType] ?? t}
                        </span>
                      ))}
                    </div>
                    <div className="bz-quiz-actions">
                      <button type="button" className="bz-btn bz-btn--sm" disabled={busy} onClick={() => void openPreview(item.id)}>
                        Peek inside
                      </button>
                      <button type="button" className="bz-btn bz-btn--primary bz-btn--sm" disabled={busy} onClick={() => void copyQuiz(item.id)}>
                        Copy to library
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {preview ? (
        <div className="bz-backdrop" onClick={() => setPreview(null)}>
          <div className="bz-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="bz-modal-head">
              <div className="min-w-0">
                <p className="bz-kicker">
                  {categoryLabel(preview.category)} · by {preview.ownerDisplayName}
                </p>
                <h2 className="bz-h2 mt-1">{preview.title}</h2>
                {preview.description ? <p className="bz-muted mt-2">{preview.description}</p> : null}
              </div>
              <button type="button" className="bz-iconbtn" aria-label="Close" onClick={() => setPreview(null)}>
                ✕
              </button>
            </div>
            <ol className="bz-list mt-4">
              {preview.questions.map((qu, i) => (
                <li key={qu.id} className="bz-listrow" style={{ justifyContent: "flex-start" }}>
                  <span className="bz-qnum">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="bz-faint">
                      {BLITZ_TYPE_LABEL[qu.type]} · {qu.timeLimitSec}s
                    </span>
                    <strong style={{ display: "block", lineHeight: 1.25 }}>{qu.prompt || "Untitled"}</strong>
                  </span>
                </li>
              ))}
            </ol>
            <button type="button" className="bz-btn bz-btn--primary bz-btn--block bz-btn--lg mt-5" disabled={busy} onClick={() => void copyQuiz(preview.id)}>
              Copy to my library
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
