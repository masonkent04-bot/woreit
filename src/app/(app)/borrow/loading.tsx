import { SkeletonRow, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonText width="50%" className="!h-7" />
      {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
