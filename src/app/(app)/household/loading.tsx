import { SkeletonRow, SkeletonText, SkeletonBox } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <SkeletonText width="100px" />
        <SkeletonText width="60%" className="!h-8" />
      </div>
      <SkeletonBox className="!h-24" />
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
