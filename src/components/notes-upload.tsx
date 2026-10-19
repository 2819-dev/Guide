"use client";

import { useEffect, useState } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  sourceFilename: string | null;
  createdAt: string;
};

type Props = {
  dafId: string;
  onNotesChange?: (notes: Note[]) => void;
};

export function NotesUpload({ dafId, onNotesChange }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("After-school notes");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/notes?dafId=${dafId}`);
    if (!res.ok) return;
    const data = (await res.json()) as { notes: Note[] };
    setNotes(data.notes);
    onNotesChange?.(data.notes);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dafId]);

  async function saveText(text: string, filename?: string) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dafId,
          title,
          content: text,
          sourceFilename: filename,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Could not save notes");
      }
      setContent("");
      setStatus("Notes saved. You can quiz from them below.");
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    if (text.trim().length < 10) {
      setStatus("That file looks too short — paste a bit more.");
      return;
    }
    await saveText(text, file.name);
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="display text-2xl font-semibold text-forest-900">
          Upload study notes
        </h3>
        <p className="mt-1 text-ink-soft">
          After school homework: paste or upload tonight&apos;s notes, then get
          quiz questions drawn from your writing and this daf.
        </p>
      </div>

      <div className="space-y-3 rounded-[1.25rem] border border-forest-800/10 bg-white/60 p-4 sm:p-5">
        <label className="block text-sm font-semibold text-forest-800">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-forest-800/15 bg-white/80 px-3 py-2 font-normal outline-none ring-forest-500/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-800">
          Notes
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Key distinctions, cases, questions you still have…"
            className="mt-1 w-full rounded-xl border border-forest-800/15 bg-white/80 px-3 py-2 font-normal outline-none ring-forest-500/30 focus:ring-2"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy || content.trim().length < 10}
            onClick={() => void saveText(content)}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save notes"}
          </button>
          <label className="btn-ghost cursor-pointer">
            Upload .txt
            <input
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {status && <p className="text-sm font-medium text-forest-700">{status}</p>}
      </div>

      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-forest-800/10 bg-forest-100/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-forest-900">{note.title}</span>
                <span className="text-xs text-ink-soft">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                {note.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
