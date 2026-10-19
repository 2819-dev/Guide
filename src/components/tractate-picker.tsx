import Link from "next/link";
import { TRACTATES, studyPath } from "@/lib/tractates";

export function TractatePicker() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TRACTATES.map((t) => {
        const href = t.available
          ? studyPath(t.slug)
          : undefined;
        const Inner = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="hebrew text-xl text-forest-700">{t.hebrewName}</p>
                <h2 className="display mt-1 text-2xl text-forest-950">
                  {t.englishName}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  t.available
                    ? "bg-forest-700 text-white"
                    : "bg-forest-100 text-forest-700"
                }`}
              >
                {t.available ? "Available now" : "Coming soon"}
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-muted">{t.blurb}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
              {t.kind === "mishnah" ? "Mishnah" : "Gemara"}
            </p>
          </>
        );

        if (!href) {
          return (
            <div
              key={t.slug}
              className="panel !rounded-2xl opacity-80 shadow-[0_8px_24px_rgba(22,53,40,0.04)]"
            >
              {Inner}
            </div>
          );
        }

        return (
          <Link
            key={t.slug}
            href={href}
            className="panel !rounded-2xl no-underline shadow-[0_8px_24px_rgba(22,53,40,0.04)] transition hover:border-forest-300"
          >
            {Inner}
          </Link>
        );
      })}
    </div>
  );
}
