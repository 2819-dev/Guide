"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  TESTQUIZ_DISCOVER_CATEGORIES,
  categoryLabel,
} from "@/lib/testquiz/discover";
import { TESTQUIZ_TYPE_LABEL } from "@/lib/testquiz/types";
import type { TestQuizDiscoverCard, TestQuizDocument } from "@/lib/testquiz/types";

export function TestQuizDiscoverPanel() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [quizzes, setQuizzes] = useState<TestQuizDiscoverCard[]>([]);
  const [preview, setPreview] = useState<
    (TestQuizDocument & { ownerDisplayName: string }) | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    params.set("sort", sort);
    const res = await fetch(`/api/testquiz/discover?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load Discover");
      return;
    }
    setQuizzes(data.quizzes ?? []);
  }, [q, category, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openPreview(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/testquiz/discover/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      setPreview(data.quiz);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function useQuiz(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/testquiz/discover/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not copy");
      router.push(`/apps/testquiz/edit/${data.quiz.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not copy");
      setBusy(false);
    }
  }

  return (
    <div className="tq-rise mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tq-badge">Discover</p>
          <h1 className="tq-brand mt-2">Find TestQuizzes</h1>
          <p className="mt-2 max-w-xl text-[var(--tq-muted)]">
            Browse quizzes teachers posted for schools. Preview, then copy into
            your library to host.
          </p>
        </div>
        <Link href="/apps/testquiz/library" className="tq-btn tq-btn-ghost no-underline">
          My library
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="tq-input max-w-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or description"
          aria-label="Search Discover"
        />
        <select
          className="tq-select max-w-[12rem]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {TESTQUIZ_DISCOVER_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="tq-select max-w-[10rem]"
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "popular")}
          aria-label="Sort"
        >
          <option value="recent">Newest</option>
          <option value="popular">Most copied</option>
        </select>
        <button
          type="button"
          className="tq-btn tq-btn-primary"
          onClick={() => void load()}
        >
          Search
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-[rgba(255,107,74,0.15)] px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {quizzes.length === 0 ? (
            <div className="tq-soft p-8 text-[var(--tq-muted)] sm:col-span-2">
              No public quizzes yet. Publish one from your library editor.
            </div>
          ) : (
            quizzes.map((item) => (
              <article key={item.id} className="tq-tile flex flex-col">
                <div className="tq-cover-strip" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tq-badge">{categoryLabel(item.category)}</span>
                  <span className="text-xs text-[var(--tq-muted)]">
                    {item.copyCount} copies
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-bold">{item.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--tq-muted)]">
                  {item.description || "No description"}
                </p>
                <p className="mt-2 text-xs text-[var(--tq-muted)]">
                  {item.questionCount} questions · by {item.ownerDisplayName}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <button
                    type="button"
                    className="tq-btn tq-btn-ghost text-sm"
                    disabled={busy}
                    onClick={() => void openPreview(item.id)}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="tq-btn tq-btn-primary text-sm"
                    disabled={busy}
                    onClick={() => void useQuiz(item.id)}
                  >
                    Use quiz
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="tq-panel h-fit p-5">
          {!preview ? (
            <p className="text-sm text-[var(--tq-muted)]">
              Select Preview to inspect questions before copying.
            </p>
          ) : (
            <div className="tq-rise space-y-3">
              <p className="tq-badge">{categoryLabel(preview.category)}</p>
              <h2 className="text-xl font-bold">{preview.title}</h2>
              <p className="text-sm text-[var(--tq-muted)]">
                by {preview.ownerDisplayName}
              </p>
              <p className="text-sm">{preview.description}</p>
              <ol className="max-h-[50vh] space-y-2 overflow-auto text-sm">
                {preview.questions.map((qu, i) => (
                  <li key={qu.id} className="tq-soft px-3 py-2">
                    <span className="text-xs text-[var(--tq-muted)]">
                      {i + 1}. {TESTQUIZ_TYPE_LABEL[qu.type]} · {qu.timeLimitSec}s
                    </span>
                    <div className="font-semibold">{qu.prompt || "Untitled"}</div>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="tq-btn tq-btn-primary w-full"
                disabled={busy}
                onClick={() => void useQuiz(preview.id)}
              >
                Copy to my library
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
