"use client";

import { Search, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SearchBar({ className }) {
  const { searchQuery, setSearchQuery } = useAppStore();

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar restaurantes, cocina, zona..."
        className="h-10 w-full rounded-xl border bg-secondary/50 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Limpiar busqueda"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
