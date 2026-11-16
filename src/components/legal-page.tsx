import Link from "next/link";

/** Shared layout for Terms / Privacy: title, effective date, readable prose. */
export function LegalPage({
  title,
  effective,
  intro,
  children,
}: {
  title: string;
  effective: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="legal-page">
      <div className="content-band legal-page__inner">
        <p className="eyebrow">Guide</p>
        <h1 className="display-feature mt-3">{title}</h1>
        <p className="legal-page__date">Effective {effective}</p>
        <div className="legal-page__intro">{intro}</div>
        <nav className="legal-page__switch" aria-label="Legal pages">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
        <article className="legal-prose">{children}</article>
        <p className="legal-page__contact">
          Questions? Email{" "}
          <a href="mailto:hello@guidelearning.org">hello@guidelearning.org</a>.
        </p>
      </div>
    </div>
  );
}
