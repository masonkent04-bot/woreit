import Link from "next/link";

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="card p-10 text-center space-y-4">
      <div className="text-5xl">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted max-w-xs mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-accent text-background text-sm font-medium"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
