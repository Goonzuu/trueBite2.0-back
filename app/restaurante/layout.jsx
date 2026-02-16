"use client";

import Link from "next/link";

export default function RestauranteLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/restaurante" className="flex items-center gap-1.5">
            <span className="text-lg font-bold tracking-tight text-primary font-serif">
              TrueBite
            </span>
            <span className="text-sm text-muted-foreground">· Panel Restaurante</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver app comensal
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
