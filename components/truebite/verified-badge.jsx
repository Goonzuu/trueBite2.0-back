import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className, size = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 font-medium text-primary",
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        size === "default" && "px-2 py-0.5 text-xs",
        size === "lg" && "px-2.5 py-1 text-sm",
        className
      )}
    >
      <BadgeCheck
        className={cn(
          size === "sm" && "h-3 w-3",
          size === "default" && "h-3.5 w-3.5",
          size === "lg" && "h-4 w-4"
        )}
      />
      Verificada
    </span>
  );
}
