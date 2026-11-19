"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="status-page" role="alert">
      <p className="status-page__code">Error</p>
      <h1 className="status-page__title">Something went wrong</h1>
      <p className="status-page__body">
        This page didn’t load correctly. Try again, and if it keeps
        happening, use the chat button to let the Guide team know.
      </p>
      <div className="status-page__actions">
        <button type="button" className="btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn-secondary no-underline">
          Go to the homepage
        </Link>
      </div>
      {error.digest ? (
        <p className="status-page__ref">Reference: {error.digest}</p>
      ) : null}
    </section>
  );
}
