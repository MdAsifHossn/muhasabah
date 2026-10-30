import { Skeleton } from "@/components/design/empty-state";

export default function HadithSectionLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="হাদীস লোড হচ্ছে">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="surface space-y-3 rounded-card p-5">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
