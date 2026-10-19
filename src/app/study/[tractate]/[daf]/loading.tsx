export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-forest-100" />
      <div className="mt-8 h-10 w-72 max-w-full animate-pulse rounded-lg bg-forest-100" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-forest-100/80"
          />
        ))}
      </div>
    </div>
  );
}