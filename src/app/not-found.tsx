import Link from "next/link";

export const metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="status-page">
      <p className="status-page__code">404</p>
      <h1 className="status-page__title">We couldn’t find that page</h1>
      <p className="status-page__body">
        The link may be out of date, or the page may have moved. Try one of
        these instead.
      </p>
      <div className="status-page__actions">
        <Link href="/" className="btn-primary no-underline">
          Go to the homepage
        </Link>
        <Link href="/auth/sign-in?as=student" className="btn-secondary no-underline">
          Student log in
        </Link>
        <Link href="/apps" className="btn-secondary no-underline">
          Browse apps
        </Link>
      </div>
    </section>
  );
}
