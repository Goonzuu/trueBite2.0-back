"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating = 0,
  maxStars = 5,
  size = "default",
  interactive = false,
  onChange,
  className,
}) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  };

  const starSize = sizeClasses[size] || sizeClasses.default;

  return (
    <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${rating} de ${maxStars} estrellas`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.floor(rating);
        const halfFilled = !filled && i < rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={cn(
              "relative transition-transform",
              interactive && "cursor-pointer hover:scale-110 active:scale-95",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                starSize,
                "transition-colors",
                filled
                  ? "fill-accent text-accent"
                  : halfFilled
                  ? "fill-accent/50 text-accent"
                  : "fill-none text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
