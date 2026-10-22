import { Suspense } from "react";

export const runtime = 'edge';

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-12 text-ink-muted">Loading…</div>}>
      {children}
    </Suspense>
  );
}
