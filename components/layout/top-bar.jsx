"use client";

import { useState, useEffect } from "react";
import { Search, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isComensalLoggedIn } from "@/lib/auth";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isComensalLoggedIn());
  }, [pathname]);

  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-xl font-bold tracking-tight text-primary font-serif">
            TrueBite
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isHome && (
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Buscar" asChild>
              <Link href="/?search=true">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Cambiar tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {loggedIn ? (
            <Link href="/profile">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src="/avatar.jpg" alt="Tu perfil" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  TB
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/restaurante/login"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Soy restaurante
              </Link>
              <Link href="/login">
                <Button variant="default" size="sm" className="h-8 rounded-full px-4">
                  Entrar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
