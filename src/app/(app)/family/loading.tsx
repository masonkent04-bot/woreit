import { SkeletonRow, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonText width="160px" className="!h-8" />
      <SkeletonText width="80%" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
