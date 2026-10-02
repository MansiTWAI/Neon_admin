/** Shown at once on navigation while the next page loads, so a click never feels ignored. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="mt-4 h-72 animate-pulse rounded-2xl bg-gray-100" />
    </div>
  );
}
