"use client";

import { useEffect, useState } from "react";

type School = { id: string; name: string; slug: string };

type Props = {
  name?: string;
  required?: boolean;
  emptyHint?: string;
};

/** Searchable school select for student signup (approved Neon schools). */
export function SchoolPickerField({
  name = "schoolId",
  required = true,
  emptyHint = "No schools are available yet. You can still create an account — your school will appear after it’s approved.",
}: Props) {
  const [schools, setSchools] = useState<School[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/schools")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSchools(data.schools ?? []);
      })
      .catch(() => {
        if (!cancelled) setSchools([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = schools.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <label className="block text-sm font-semibold text-forest-900">
        School
        {selected ? (
          <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-line bg-sky-soft/40 px-3 py-2.5">
            <span className="font-semibold text-forest-950">{selected.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
              className="text-sm font-semibold text-forest-800"
            >
              Change
            </button>
          </div>
        ) : (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your school"
            className="field mt-1.5"
            required={required && schools.length > 0}
          />
        )}
      </label>

      {loading && <p className="text-sm text-ink-muted">Loading schools…</p>}
      {!loading && schools.length === 0 && (
        <p className="text-sm text-ink-muted">{emptyHint}</p>
      )}
      {!selected && !loading && schools.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-line p-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-muted">No matches</li>
          ) : (
            filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelected(s)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-forest-950 hover:bg-forest-100"
                >
                  {s.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {required && schools.length > 0 && !selected && (
        <p className="text-xs text-ink-muted">Select your school to continue.</p>
      )}
    </div>
  );
}
