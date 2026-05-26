import { SkeletonBox, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <SkeletonBox className="!w-9 !h-9 !rounded-full" />
        <SkeletonText width="60%" />
      </div>
      <SkeletonBox className="aspect-square" />
      <div className="flex gap-2">
        <SkeletonBox className="!h-7 !w-24 !rounded-full" />
        <SkeletonBox className="!h-7 !w-24 !rounded-full" />
      </div>
      <SkeletonBox className="!h-40" />
      <SkeletonBox className="!h-12 !rounded-full" />
    </div>
  );
}
