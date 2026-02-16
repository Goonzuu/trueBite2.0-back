import { cn } from "@/lib/utils";

export function PriceRange({ level = 1, maxLevel = 4, className }) {
  return (
    <span className={cn("inline-flex items-center text-sm font-medium", className)} aria-label={`Precio: ${level} de ${maxLevel}`}>
      {Array.from({ length: maxLevel }, (_, i) => (
        <span
          key={i}
          className={cn(
            "transition-colors",
            i < level ? "text-foreground" : "text-muted-foreground/30"
          )}
        >
          {"$"}
        </span>
      ))}
    </span>
  );
}
