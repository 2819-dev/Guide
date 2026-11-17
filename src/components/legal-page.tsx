import Link from "next/link";

/** Shared layout for Terms, Privacy, and Accessibility: title, date, readable prose. */
export function LegalPage({
  title,
  effective,
  intro,
  children,
}: {
  title: string;
  /** Date the page was last updated, e.g. "November 16, 2026". */
  effective: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="legal-page">
      <div className="content-band legal-page__inner">
        <p className="eyebrow">Policies</p>
        <h1 className="display-feature mt-3">{title}</h1>
        <p className="legal-page__date">Last updated {effective}</p>
        <div className="legal-page__intro">{intro}</div>
        <nav className="legal-page__switch" aria-label="Legal pages">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/accessibility">Accessibility</Link>
        </nav>
        <article className="legal-prose">{children}</article>
        <p className="legal-page__contact">
          Questions about this page? Email{" "}
          <a href="mailto:hello@guidelearning.org">hello@guidelearning.org</a>.
        </p>
      </div>
    </div>
  );
}
