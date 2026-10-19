import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden">
        <div
          aria-hidden
          className="canopy-glow pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 100%, rgba(20,53,40,0.45), transparent 70%), linear-gradient(180deg, transparent 20%, rgba(7,20,15,0.35) 100%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23143528'/%3E%3Cstop offset='1' stop-color='%23246348'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1200' height='800'/%3E%3Cpath fill='%230c2419' opacity='.45' d='M0 520c80-40 160-90 260-70s170 90 280 70 190-110 300-90 170 100 260 80 140-70 200-50v270H0z'/%3E%3Cpath fill='%231c4a36' opacity='.55' d='M0 580c90-30 150-80 250-55s180 70 290 45 180-95 290-70 170 85 260 60 140-55 210-35v275H0z'/%3E%3Ccircle class='pulse' cx='180' cy='160' r='90' fill='%238fb36a' opacity='.18'/%3E%3Ccircle cx='980' cy='120' r='140' fill='%234a9a72' opacity='.16'/%3E%3C/svg%3E\") center/cover no-repeat",
          }}
        />
        <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl flex-col justify-end px-5 pb-16 pt-20 sm:px-8 sm:pb-24">
          <p className="animate-rise hebrew mb-4 text-xl text-pine sm:text-2xl">
            אלו מציאות
          </p>
          <h1 className="animate-rise-delay display max-w-3xl text-5xl font-semibold leading-[1.05] text-white sm:text-7xl">
            Guide
          </h1>
          <p className="animate-rise-late mt-5 max-w-xl text-lg leading-relaxed text-forest-100/95 sm:text-xl">
            Open a daf of Bava Metzia, read the Gemara, and quiz yourself — or
            upload tonight&apos;s notes for questions tailored to what you
            learned.
          </p>
          <div className="animate-rise-late mt-8 flex flex-wrap gap-3">
            <Link href="/study/21a" className="btn-primary">
              Start at אלו מציאות · 21a
            </Link>
            <Link
              href="/study"
              className="btn-ghost !border-white/30 !bg-white/10 !text-white hover:!bg-white/20"
            >
              Browse dapim
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="display text-3xl font-semibold text-forest-900 sm:text-4xl">
          One page. Clear questions.
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Pick a daf, study the text, then check yourself. After school, upload
          your notes and get a different quiz built from your own words plus the
          daf.
        </p>
      </section>

      <section className="border-t border-forest-800/10 bg-forest-900/95 text-forest-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-3 sm:px-8">
          <div>
            <h3 className="display text-xl font-semibold text-white">Choose</h3>
            <p className="mt-2 text-forest-200">
              Browse Bava Metzia from 2a to 119b, with אלו מציאות highlighted
              from 21a.
            </p>
          </div>
          <div>
            <h3 className="display text-xl font-semibold text-white">Read</h3>
            <p className="mt-2 text-forest-200">
              Hebrew and English on one calm page — sourced live from Sefaria.
            </p>
          </div>
          <div>
            <h3 className="display text-xl font-semibold text-white">Quiz</h3>
            <p className="mt-2 text-forest-200">
              Test from the daf alone, or mix in the notes you uploaded for
              homework review.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
