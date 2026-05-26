import { SkeletonHeader, SkeletonItemGrid, SkeletonBox } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <SkeletonBox className="!h-16" /> {/* stats card */}
      <SkeletonBox className="!h-11 !rounded-full" /> {/* search */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="!h-8 !w-24 !rounded-full" />
        ))}
      </div>
      <SkeletonItemGrid count={9} />
    </div>
  );
}
