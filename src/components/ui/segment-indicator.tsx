/**
 * Sliding "selected" pill for segmented toggles. Put it as the first child of a
 * `relative` container with `p-1` and no gap; buttons inside get `relative z-10`
 * and no background of their own, so the pill glides under the active one.
 */
export function SegmentIndicator({ count, index }: { count: number; index: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-active shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] motion-reduce:transition-none"
      style={{ width: `calc((100% - 0.5rem) / ${count})`, transform: `translateX(${Math.max(0, index) * 100}%)` }}
    />
  );
}
