"use client";

import Link from "next/link";
import { Heart, BadgeCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { RatingStars } from "./rating-stars";
import { PriceRange } from "./price-range";
import { TagPill } from "./tag-pill";
import { useAppStore } from "@/lib/store";

export function RestaurantCard({ restaurant, className }) {
  const { user, toggleFavorite } = useAppStore();
  const isFav = user.favoriteRestaurants.includes(restaurant.id);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <Link href={`/restaurants/${restaurant.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={restaurant.image || "/placeholder.svg"}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {restaurant.verified && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium backdrop-blur-sm">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground">Verificado</span>
            </div>
          )}
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(restaurant.id);
        }}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
        aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isFav ? "fill-destructive text-destructive" : "text-foreground"
          )}
        />
      </button>

      <Link href={`/restaurants/${restaurant.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-card-foreground">
              {restaurant.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {restaurant.neighborhood ? `${restaurant.neighborhood}, ${restaurant.city}` : restaurant.address}
              </span>
            </p>
          </div>
          <PriceRange level={restaurant.priceRange} className="shrink-0" />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <RatingStars rating={restaurant.rating} size="sm" />
          <span className="text-sm font-semibold text-card-foreground">
            {restaurant.rating}
          </span>
          <span className="text-xs text-muted-foreground">
            ({restaurant.reviewCount})
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag}>{tag}</TagPill>
          ))}
        </div>
      </Link>
    </div>
  );
}
