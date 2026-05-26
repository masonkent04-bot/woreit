// Manually curated types matching the supabase schema
// (Skipping codegen to avoid build dependency; small enough to hand-maintain)

export type WearStatus = "new" | "light" | "frequent" | "heavy";

export type ItemCategory =
  | "top"
  | "bottom"
  | "dress"
  | "skirt"
  | "outerwear"
  | "shoes"
  | "accessory"
  | "bag"
  | "jewelry"
  | "underwear"
  | "sleepwear"
  | "activewear"
  | "swimwear"
  | "other";

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface Profile {
  id: string;
  family_id: string | null;
  display_name: string;
  avatar_url: string | null;
  prefers_modest: boolean;
  style_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClosetItem {
  id: string;
  owner_id: string;
  family_id: string | null;
  name: string;
  category: ItemCategory;
  subcategory: string | null;
  brand: string | null;
  size: string | null;
  fits_like: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  style_tags: string[];
  season_tags: string[];
  occasion_tags: string[];
  rating: number | null;
  comfort: number | null;
  purchase_price: number | null;
  purchase_date: string | null;
  notes: string | null;
  photo_path: string | null;
  photo_bg_removed_path: string | null;
  ai_tags_pending: boolean;
  wear_count: number;
  last_worn_at: string | null;
  status: WearStatus;
  is_archived: boolean;
  is_laundry: boolean;
  created_at: string;
  updated_at: string;
}

export interface Outfit {
  id: string;
  owner_id: string;
  family_id: string | null;
  name: string | null;
  worn_at: string;
  occasion: string | null;
  weather_temp_f: number | null;
  weather_condition: string | null;
  photo_path: string | null;
  notes: string | null;
  ai_generated: boolean;
  created_at: string;
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  top: "Top",
  bottom: "Bottoms",
  dress: "Dress",
  skirt: "Skirt",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
  bag: "Bag",
  jewelry: "Jewelry",
  underwear: "Underwear",
  sleepwear: "Sleepwear",
  activewear: "Activewear",
  swimwear: "Swimwear",
  other: "Other",
};

export const WEAR_STATUS_LABELS: Record<WearStatus, { label: string; tone: string }> = {
  new: { label: "Never worn", tone: "text-warn" },
  light: { label: "Worn a few", tone: "text-foreground" },
  frequent: { label: "Worn often", tone: "text-success" },
  heavy: { label: "Worn a lot", tone: "text-muted" },
};

export const STYLE_TAGS = [
  "casual",
  "dressy",
  "athletic",
  "vintage",
  "trendy",
  "classic",
  "bohemian",
  "edgy",
  "preppy",
  "minimalist",
] as const;

export const OCCASION_TAGS = [
  "church",
  "work",
  "casual",
  "date",
  "party",
  "gym",
  "lounging",
  "errands",
] as const;

export const SEASON_TAGS = ["spring", "summer", "fall", "winter"] as const;
