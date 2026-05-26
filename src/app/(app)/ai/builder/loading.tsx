import { SkeletonBox, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <SkeletonText width="60%" className="!h-8" />
        <SkeletonText width="90%" />
      </div>
      <SkeletonBox className="!h-48" />
    </div>
  );
}
