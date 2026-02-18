"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { TopBar } from "./top-bar";
import { BottomTabs } from "./bottom-tabs";

/** Oculta TopBar y BottomTabs en login y panel restaurante. */
export function AppShell({ children }) {
  const pathname = usePathname();
  const loadConfigs = useAppStore((s) => s.loadRestaurantConfigsFromStorage);
  const loadFavorites = useAppStore((s) => s.loadFavoritesFromStorage);

  useEffect(() => {
    loadConfigs?.();
    loadFavorites?.();
  }, [loadConfigs, loadFavorites]);
  const hideMainNav =
    pathname?.startsWith("/restaurante") || pathname === "/login";

  if (hideMainNav) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex-1 pb-20">{children}</main>
      <BottomTabs />
    </div>
  );
}
