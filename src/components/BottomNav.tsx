"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLinkStatus } from "next/link";
import { Shirt, Calendar, Home, Sparkles, Users, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const tabs = [
  { href: "/closet", label: "Closet", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Calendar },
  { href: "/ai/builder", label: "AI", icon: Sparkles },
  { href: "/household", label: "Home", icon: Home },
  { href: "/family", label: "Family", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/85 backdrop-blur pb-safe"
    >
      <ul className="grid grid-cols-6 max-w-2xl mx-auto">
        {tabs.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link href={href} prefetch={true} aria-current={active ? "page" : undefined}>
                <TabContent active={active} label={label} icon={icon} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// useLinkStatus must be called inside a child of Link to read its pending state.
// Gives instant 'navigating' feedback even before the new page renders.
function TabContent({ active, label, icon: Icon }: { active: boolean; label: string; icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 h-14 text-[10px] transition-colors ${
        active ? "text-foreground" : pending ? "text-accent" : "text-muted"
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.2 : pending ? 2 : 1.6}
        className={pending ? "animate-pulse" : ""}
      />
      <span>{label}</span>
    </div>
  );
}
