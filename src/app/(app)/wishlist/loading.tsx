import { SkeletonHeader, SkeletonItemGrid } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <SkeletonItemGrid count={6} />
    </div>
  );
}
