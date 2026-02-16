"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, CalendarCheck, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { isComensalLoggedIn } from "@/lib/auth";

const tabs = [
  { href: "/", label: "Explorar", icon: Compass, public: true },
  { href: "/reservations", label: "Reservas", icon: CalendarCheck, public: false },
  { href: "/ranking", label: "Ranking", icon: Trophy, public: true },
  { href: "/profile", label: "Perfil", icon: User, public: false },
];

export function BottomTabs() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isComensalLoggedIn());
  }, [pathname]);

  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function getHref(tab) {
    if (tab.public || loggedIn) return tab.href;
    return `/login?redirect=${encodeURIComponent(tab.href)}`;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-lg"
      role="tablist"
      aria-label="Navegacion principal"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={getHref(tab)}
              role="tab"
              aria-selected={active}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-all",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={cn("font-medium", active && "font-semibold")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
