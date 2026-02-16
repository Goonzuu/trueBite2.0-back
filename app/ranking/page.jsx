"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { RatingStars } from "@/components/truebite/rating-stars";
import { PriceRange } from "@/components/truebite/price-range";
import { TagPill } from "@/components/truebite/tag-pill";
import { VerifiedBadge } from "@/components/truebite/verified-badge";
import {
  Trophy,
  BadgeCheck,
  ChevronRight,
  ShieldCheck,
  MapPin,
  CalendarCheck,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_REVIEWS_FOR_RANKING = 5;

export default function RankingPage() {
  const { restaurants } = useAppStore();
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Derive city and neighborhood options from the restaurants
  const cities = useMemo(() => {
    const unique = [...new Set(restaurants.map((r) => r.city))];
    return ["Todas", ...unique.sort()];
  }, [restaurants]);

  const neighborhoods = useMemo(() => {
    const filtered =
      selectedCity === "Todas"
        ? restaurants
        : restaurants.filter((r) => r.city === selectedCity);
    const unique = [...new Set(filtered.map((r) => r.neighborhood))];
    return unique.sort();
  }, [restaurants, selectedCity]);

  const categories = useMemo(() => {
    const unique = [...new Set(restaurants.map((r) => r.cuisineCategory))];
    return ["Todos", ...unique.sort()];
  }, [restaurants]);

  // Weighted ranking: rating * log10(reviewCount + 1), minimum volume threshold
  const ranked = useMemo(() => {
    return restaurants
      .filter((r) => {
        const matchCity =
          selectedCity === "Todas" || r.city === selectedCity;
        const matchCategory =
          selectedCategory === "Todos" ||
          r.cuisineCategory === selectedCategory;
        return matchCity && matchCategory;
      })
      .map((r) => ({
        ...r,
        weightedScore: r.rating * Math.log10(r.reviewCount + 1),
        meetsMinimum: r.reviewCount >= MIN_REVIEWS_FOR_RANKING,
      }))
      .sort((a, b) => {
        // Restaurants meeting minimum first, then by weighted score
        if (a.meetsMinimum && !b.meetsMinimum) return -1;
        if (!a.meetsMinimum && b.meetsMinimum) return 1;
        return b.weightedScore - a.weightedScore;
      })
      .slice(0, 20);
  }, [restaurants, selectedCity, selectedCategory]);

  const medalClasses = [
    "from-accent/20 to-accent/5 border-accent/30",
    "from-muted-foreground/15 to-muted/5 border-muted-foreground/20",
    "from-primary/15 to-primary/5 border-primary/20",
  ];

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-serif">
          Ranking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los mejores restaurantes segun comensales reales
        </p>
      </div>

      {/* Verified explanation */}
      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-medium text-foreground">
            Ranking basado solo en reviews verificadas
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cada review proviene de una reserva real completada. Esto garantiza opiniones 
            auténticas y confiables. Mínimo {MIN_REVIEWS_FOR_RANKING} reviews verificadas 
            para aparecer en el ranking.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* City selector */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3 w-3" />
            Ciudad
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {cities.map((city) => (
              <TagPill
                key={city}
                active={selectedCity === city}
                onClick={() => setSelectedCity(city)}
              >
                {city}
              </TagPill>
            ))}
          </div>
          {/* Show neighborhoods when a city is selected */}
          {selectedCity !== "Todas" && neighborhoods.length > 0 && (
            <div className="mt-1 flex gap-2 overflow-x-auto no-scrollbar">
              {neighborhoods.map((n) => (
                <span
                  key={n}
                  className="inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Category selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Categoria
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <TagPill
                key={cat}
                active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </TagPill>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {ranked.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Trophy className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">
            No hay restaurantes
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            No encontramos restaurantes con los filtros seleccionados. Prueba
            con otra ciudad o categoria.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ranked.map((restaurant, index) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.id}`}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition-all hover:shadow-md",
                index < 3 && `bg-gradient-to-r ${medalClasses[index]}`
              )}
            >
              {/* Rank number */}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm",
                  index === 0
                    ? "bg-accent/20 text-accent-foreground"
                    : index === 1
                    ? "bg-muted text-muted-foreground"
                    : index === 2
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {index < 3 ? (
                  <Trophy
                    className={cn(
                      "h-5 w-5",
                      index === 0
                        ? "text-accent-foreground"
                        : index === 1
                        ? "text-muted-foreground"
                        : "text-primary"
                    )}
                  />
                ) : (
                  `#${index + 1}`
                )}
              </div>

              {/* Image */}
              <img
                src={restaurant.image || "/placeholder.svg"}
                alt={restaurant.name}
                className="h-14 w-14 rounded-xl object-cover shrink-0"
                crossOrigin="anonymous"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-card-foreground">
                    {restaurant.name}
                  </span>
                  {restaurant.verified && (
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-2">
                  <RatingStars rating={restaurant.rating} size="sm" />
                  <span className="text-xs font-semibold text-card-foreground">
                    {restaurant.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({restaurant.reviewCount} reviews)
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <TagPill>{restaurant.cuisine}</TagPill>
                  <PriceRange
                    level={restaurant.priceRange}
                    className="text-xs"
                  />
                  {restaurant.reservationsThisMonth && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <CalendarCheck className="h-2.5 w-2.5" />
                      {restaurant.reservationsThisMonth} reservas/mes
                    </span>
                  )}
                </div>

                {!restaurant.meetsMinimum && (
                  <span className="mt-1 flex items-center gap-0.5 text-[10px] text-muted-foreground/70 italic">
                    <Info className="h-2.5 w-2.5" />
                    Menos de {MIN_REVIEWS_FOR_RANKING} reviews
                  </span>
                )}
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}

      {/* Methodology note */}
      <div className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          El ranking combina la puntuacion media ponderada con el volumen de
          reviews verificadas. Los restaurantes con menos de{" "}
          {MIN_REVIEWS_FOR_RANKING} reviews aparecen al final de la lista.
        </p>
      </div>
    </div>
  );
}
