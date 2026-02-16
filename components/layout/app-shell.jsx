"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./top-bar";
import { BottomTabs } from "./bottom-tabs";

/** Oculta TopBar y BottomTabs en login y panel restaurante. */
export function AppShell({ children }) {
  const pathname = usePathname();
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
