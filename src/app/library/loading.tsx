/** Skeleton shaped like the hero + book grid, so loading never jumps. */
export default function LibraryLoading() {
  return (
    <div aria-busy="true" aria-label="লোড হচ্ছে" className="space-y-6">
      <div className="hero-surface h-52 animate-pulse rounded-[1.5rem] opacity-80" />
      <div className="h-11 w-56 animate-pulse rounded-xl bg-muted" />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <li key={index}>
            <div className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            <div className="mt-2.5 h-4 w-4/5 animate-pulse rounded bg-muted" />
            <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}
