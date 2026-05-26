import Image from "next/image";
import Link from "next/link";
import type { ClosetItem } from "@/lib/types";
import WearStatusBadge from "./WearStatusBadge";
import { createClient } from "@/lib/supabase/client";

export default function ItemCard({
  item,
  href,
}: {
  item: ClosetItem;
  href?: string;
}) {
  const url = item.photo_path ? publicUrl(item.photo_path) : null;
  const target = href ?? `/closet/${item.id}`;

  return (
    <Link
      href={target}
      className="block group"
      aria-label={`${item.name}, ${item.category}`}
    >
      <div className="relative aspect-square card overflow-hidden">
        {url ? (
          <Image
            src={url}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted">
            👕
          </div>
        )}
        <div className="absolute top-2 left-2">
          <WearStatusBadge status={item.status} count={item.wear_count} />
        </div>
      </div>
      <div className="pt-2 px-1">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted capitalize">
          {item.category}
          {item.subcategory ? ` · ${item.subcategory}` : ""}
        </p>
      </div>
    </Link>
  );
}

function publicUrl(path: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from("item-photos").getPublicUrl(path, {
    transform: { width: 600, height: 600, resize: "cover", quality: 80 },
  });
  return data.publicUrl;
}
