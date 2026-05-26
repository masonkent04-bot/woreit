import { SkeletonHeader, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
