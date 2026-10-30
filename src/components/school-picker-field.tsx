"use client";

import { useEffect, useState } from "react";

type School = { id: string; name: string; slug: string };

type Props = {
  name?: string;
  required?: boolean;
  emptyHint?: string;
};

/** Typeahead school select for student signup — matches only while typing. */
export function SchoolPickerField({
  name = "schoolId",
  required = true,
  emptyHint = "No schools match that name yet. You can still create an account — ask your school to apply for Guide if you do not see it.",
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

  const queryTrimmed = query.trim();
  const queryLower = queryTrimmed.toLowerCase();
  const filtered =
    queryLower.length === 0
      ? []
      : schools.filter(
          (s) =>
            s.name.toLowerCase().includes(queryLower) ||
            s.slug.toLowerCase().includes(queryLower),
        );

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
            placeholder="Start typing your school name"
            className="field mt-1.5"
            required={required && !selected}
            autoComplete="organization"
            aria-autocomplete="list"
            aria-controls="signup-school-results"
            aria-expanded={queryTrimmed.length > 0}
          />
        )}
      </label>

      {loading && <p className="text-sm text-ink-muted">Getting ready…</p>}
      {!selected && !loading && queryTrimmed.length === 0 && (
        <p className="text-sm text-ink-muted">
          Keep typing to find your school.
        </p>
      )}
      {!selected &&
        !loading &&
        queryTrimmed.length > 0 &&
        filtered.length === 0 && (
          <p className="text-sm text-ink-muted">{emptyHint}</p>
        )}
      {!selected && filtered.length > 0 && (
        <ul
          id="signup-school-results"
          className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-line p-1"
          role="listbox"
          aria-label="Matching schools"
        >
          {filtered.map((s) => (
            <li key={s.id} role="option">
              <button
                type="button"
                onClick={() => setSelected(s)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-forest-950 hover:bg-forest-100"
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {required && !selected && queryTrimmed.length > 0 && filtered.length > 0 && (
        <p className="text-xs text-ink-muted">Select your school to continue.</p>
      )}
    </div>
  );
}
