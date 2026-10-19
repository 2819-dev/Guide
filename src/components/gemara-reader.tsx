"use client";

import { useState } from "react";
import type { DafText } from "@/lib/sefaria";

type Props = {
  text: DafText;
};

export function GemaraReader({ text }: Props) {
  const [showEnglish, setShowEnglish] = useState(true);
  const max = Math.max(text.hebrew.length, text.english.length);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="hebrew text-2xl text-forest-800">{text.heRef}</p>
          <h2 className="display text-3xl font-semibold text-forest-950">
            {text.daf.englishLabel}
          </h2>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-forest-800/15 bg-white/60 px-3 py-2 text-sm font-semibold text-forest-800">
          <input
            type="checkbox"
            checked={showEnglish}
            onChange={(e) => setShowEnglish(e.target.checked)}
            className="size-4 accent-forest-600"
          />
          Show English
        </label>
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-forest-800/10 bg-white/65 p-5 shadow-[0_20px_50px_rgba(16,32,24,0.08)] backdrop-blur-sm sm:p-8">
        {max === 0 && (
          <p className="text-ink-soft">
            Text for this daf isn&apos;t available from Sefaria right now.
          </p>
        )}
        {Array.from({ length: max }).map((_, i) => (
          <article
            key={i}
            className="grid gap-3 border-b border-forest-800/8 pb-4 last:border-0 last:pb-0 sm:grid-cols-2"
          >
            <p className="hebrew text-xl text-forest-950 sm:text-[1.35rem]">
              {text.hebrew[i] ?? ""}
            </p>
            {showEnglish && (
              <p className="text-[1.05rem] leading-relaxed text-ink-soft">
                {text.english[i] ?? ""}
              </p>
            )}
          </article>
        ))}
      </div>

      <p className="text-xs text-ink-soft">
        Text courtesy of{" "}
        <a
          href={`https://www.sefaria.org/${text.daf.sefariaRef}`}
          className="font-semibold text-forest-700 underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Sefaria
        </a>
        .
      </p>
    </div>
  );
}
