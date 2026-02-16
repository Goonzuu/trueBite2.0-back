'use client';

import { cn } from "@/lib/utils";

export function TagPill({ children, active = false, onClick, className }) {
  const Comp = onClick ? "button" : "span";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </Comp>
  );
}
