import { SkeletonBox, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonText width="40%" className="!h-8" />
      <SkeletonBox className="!h-64" />
      <SkeletonBox className="!h-32" />
    </div>
  );
}
