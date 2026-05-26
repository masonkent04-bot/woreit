import { SkeletonHeader, SkeletonBox } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <SkeletonBox className="!h-9 !w-32 !rounded-full mx-auto" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonBox key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}
