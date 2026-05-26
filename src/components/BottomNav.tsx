"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shirt, Calendar, Users, Sparkles, Settings } from "lucide-react";

const tabs = [
  { href: "/closet", label: "Closet", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Calendar },
  { href: "/ai/builder", label: "AI", icon: Sparkles },
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
      <ul className="grid grid-cols-5 max-w-2xl mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-1 h-14 text-[11px] ${
                  active ? "text-foreground" : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
