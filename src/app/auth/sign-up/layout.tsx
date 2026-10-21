import { Suspense } from "react";

export const runtime = 'edge';

export default function SignUpLayout({
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
