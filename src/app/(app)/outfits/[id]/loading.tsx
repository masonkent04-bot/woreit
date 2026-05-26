import { SkeletonBox, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <SkeletonBox className="!w-9 !h-9 !rounded-full" />
        <div className="flex-1 space-y-1">
          <SkeletonText width="40%" />
          <SkeletonText width="60%" className="!h-5" />
        </div>
      </div>
      <SkeletonBox className="aspect-[3/4]" />
      <div className="flex gap-2">
        <SkeletonBox className="!h-9 !w-16 !rounded-full" />
        <SkeletonBox className="!h-9 !w-16 !rounded-full" />
        <SkeletonBox className="!h-9 !w-20 !rounded-full" />
      </div>
    </div>
  );
}
