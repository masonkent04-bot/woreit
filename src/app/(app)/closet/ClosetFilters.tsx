"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CATEGORY_LABELS, OCCASION_TAGS, SEASON_TAGS, type ItemCategory } from "@/lib/types";

type Params = {
  q?: string;
  status?: string;
  category?: string;
  scope?: string;
  season?: string;
  occasion?: string;
  laundry?: string;
  archived?: string;
};

// Filters live in URL params so refresh/share preserves them.
// Search has 250ms debounce; chip toggles are immediate.
export default function ClosetFilters({ params }: { params: Params }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(params.q ?? "");
  const [expanded, setExpanded] = useState(false);

  // Debounce search input → URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.q ?? "") !== q) {
        const next = { ...params, q: q || undefined };
        router.replace(buildUrl(pathname, next));
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function set(key: keyof Params, value: string | undefined) {
    const next = { ...params, [key]: value || undefined };
    router.replace(buildUrl(pathname, next));
  }

  function toggle(key: keyof Params, value: string) {
    set(key, params[key] === value ? undefined : value);
  }

  const activeCount = Object.entries(params).filter(([k, v]) => v && k !== "q").length;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name"
          className="w-full h-11 pl-11 pr-11 rounded-full border border-border bg-card text-sm"
          inputMode="search"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background flex items-center justify-center"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick filters + expand toggle */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs border ${
            expanded || activeCount > 0
              ? "bg-accent text-background border-accent"
              : "border-border bg-card"
          }`}
        >
          <SlidersHorizontal size={12} />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>

        <Chip on={params.status === "new"} onClick={() => toggle("status", "new")} label="Never worn" />
        <Chip on={params.status === "underworn"} onClick={() => toggle("status", "underworn")} label="Underworn" />
        <Chip on={params.status === "heavy"} onClick={() => toggle("status", "heavy")} label="Worn a lot" />
        <Chip on={params.laundry === "1"} onClick={() => toggle("laundry", "1")} label="🧺 Laundry" />
        <Chip on={params.archived === "1"} onClick={() => toggle("archived", "1")} label="Donate pile" />
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div className="card p-3 space-y-3">
          <FilterRow label="Category">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Chip
                key={key}
                on={params.category === key}
                onClick={() => toggle("category", key as ItemCategory)}
                label={label}
              />
            ))}
          </FilterRow>

          <FilterRow label="Scope">
            <Chip on={params.scope === "personal"} onClick={() => toggle("scope", "personal")} label="Personal" />
            <Chip on={params.scope === "household"} onClick={() => toggle("scope", "household")} label="Household" />
          </FilterRow>

          <FilterRow label="Season">
            {SEASON_TAGS.map(s => (
              <Chip key={s} on={params.season === s} onClick={() => toggle("season", s)} label={s} />
            ))}
          </FilterRow>

          <FilterRow label="Occasion">
            {OCCASION_TAGS.map(o => (
              <Chip key={o} on={params.occasion === o} onClick={() => toggle("occasion", o)} label={o} />
            ))}
          </FilterRow>

          {activeCount > 0 && (
            <button
              onClick={() => router.replace(pathname)}
              className="w-full h-9 text-xs text-muted underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 h-8 px-3 rounded-full text-xs border capitalize ${
        on ? "bg-accent text-background border-accent" : "border-border bg-card"
      }`}
    >
      {label}
    </button>
  );
}

function buildUrl(pathname: string, params: Params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `${pathname}?${s}` : pathname;
}
