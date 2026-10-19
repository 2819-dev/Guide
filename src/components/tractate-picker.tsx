import Link from "next/link";
import { TRACTATES, studyPath } from "@/lib/tractates";

export function TractatePicker() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {TRACTATES.map((t) => {
        const href = t.available ? studyPath(t.slug) : undefined;
        const Inner = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="hebrew text-lg text-forest-800">{t.hebrewName}</p>
                <h2 className="mt-1 text-lg font-semibold text-forest-950">
                  {t.englishName}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                  t.available
                    ? "bg-forest-800 text-white"
                    : "border border-line bg-paper text-ink-muted"
                }`}
              >
                {t.available ? "Available" : "Coming soon"}
              </span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
              {t.blurb}
            </p>
            <p className="mt-2 text-xs font-medium text-forest-600">
              {t.kind === "mishnah" ? "Mishnah" : "Gemara"}
            </p>
          </>
        );

        if (!href) {
          return (
            <div key={t.slug} className="panel opacity-75">
              {Inner}
            </div>
          );
        }

        return (
          <Link
            key={t.slug}
            href={href}
            className="panel no-underline transition hover:border-forest-400"
          >
            {Inner}
          </Link>
        );
      })}
    </div>
  );
}
