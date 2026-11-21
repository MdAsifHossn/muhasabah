/**
 * Instant skeleton inside the dashboard shell: the sidebar / header / bottom
 * nav stay on screen and only the page area shimmers while its data loads.
 * (Without this boundary a menu tap waited for the server with no feedback.)
 */
export default function ShellLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="লোড হচ্ছে">
      <div className="h-36 rounded-card bg-surface-sunken" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 rounded-card bg-surface-sunken" />
        ))}
      </div>
      <div className="h-56 rounded-card bg-surface-sunken" />
    </div>
  );
}
