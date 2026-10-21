export const runtime = 'edge';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-forest-100" />
      <div className="mt-6 h-12 w-80 max-w-full animate-pulse rounded-lg bg-forest-100" />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-forest-100/80"
          />
        ))}
      </div>
    </div>
  );
}
