import { SkeletonBox, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <SkeletonText width="50%" className="!h-7" />
        <SkeletonText width="70%" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBox key={i} className="!h-32" />
      ))}
    </div>
  );
}
