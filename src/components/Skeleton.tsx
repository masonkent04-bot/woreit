// Reusable skeleton building blocks. Composed in loading.tsx files.

export function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ width = "100%", className = "" }: { width?: string; className?: string }) {
  return <div className={`skeleton ${className}`} style={{ width, height: "1em" }} aria-hidden="true" />;
}

export function SkeletonItemGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBox className="aspect-square" />
          <SkeletonText width="70%" />
          <SkeletonText width="40%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="flex items-center justify-between">
      <SkeletonText width="120px" className="!h-8" />
      <SkeletonBox className="!rounded-full !w-10 !h-10" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="card p-4 flex gap-3 items-center">
      <SkeletonBox className="!w-12 !h-12 !rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonText width="60%" />
        <SkeletonText width="40%" />
      </div>
    </div>
  );
}
