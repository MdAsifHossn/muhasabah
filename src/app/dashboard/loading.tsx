export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-5 p-4 sm:p-6" aria-busy="true" aria-label="লোড হচ্ছে">
      <div className="h-40 rounded-card bg-surface-sunken" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 rounded-card bg-surface-sunken" />
        ))}
      </div>
      <div className="h-64 rounded-card bg-surface-sunken" />
    </div>
  );
}
