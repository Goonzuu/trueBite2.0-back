"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { RatingStars } from "@/components/truebite/rating-stars";
import { VerifiedBadge } from "@/components/truebite/verified-badge";
import { TagPill } from "@/components/truebite/tag-pill";
import {
  Star,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  LogOut,
  BarChart3,
} from "lucide-react";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { isRestauranteLoggedIn, logoutRestaurante, getRestauranteRestaurantId } from "@/lib/auth";

export default function RestauranteReviewsPage() {
  const router = useRouter();
  const { reviews, restaurants, getRestaurantById } = useAppStore();
  const restaurantId = getRestauranteRestaurantId();
  const currentRestaurant = restaurantId ? getRestaurantById(restaurantId) : null;

  // Solo las reviews de ESTE restaurante
  const myReviews = useMemo(() => {
    if (!restaurantId) return [];
    return reviews.filter((r) => r.restaurantId === restaurantId);
  }, [reviews, restaurantId]);

  useEffect(() => {
    if (!isRestauranteLoggedIn()) {
      router.push("/restaurante/login");
      return;
    }
    if (!restaurantId) {
      router.push("/restaurante/login");
    }
  }, [router, restaurantId]);

  const kpis = useMemo(() => {
    const total = myReviews.length;
    const avgRating =
      total > 0
        ? Math.round((myReviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
        : 0;
    const avgFood =
      total > 0
        ? Math.round(
            (myReviews.reduce((sum, r) => sum + (r.categories?.food || 0), 0) / total) * 10
          ) / 10
        : 0;
    const verifiedCount = myReviews.filter((r) => r.verified).length;
    return {
      total,
      avgRating,
      avgFood,
      verifiedCount,
      verifiedPercentage: total > 0 ? Math.round((verifiedCount / total) * 100) : 0,
    };
  }, [myReviews]);

  const ratingDistribution = useMemo(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    myReviews.forEach((r) => {
      const rating = Math.floor(r.rating);
      if (rating >= 1 && rating <= 5) dist[rating]++;
    });
    return dist;
  }, [myReviews]);

  const maxCount = Math.max(...Object.values(ratingDistribution));

  function handleLogout() {
    logoutRestaurante();
    localStorage.removeItem("truebite_admin");
    router.push("/restaurante/login");
  }

  if (!restaurantId) return null;

  return (
    <div className="flex flex-col gap-6 px-4 py-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">
            Reviews Verificadas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentRestaurant
              ? `Opiniones de comensales sobre ${currentRestaurant.name}`
              : "Todas las opiniones son de comensales con reserva completada"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrimaryButton size="sm" onClick={() => router.push("/restaurante")}>
            Reservas
          </PrimaryButton>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{kpis.total}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-accent" />
            <p className="text-xs text-muted-foreground">Rating Promedio</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{kpis.avgRating}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Verificadas</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{kpis.verifiedPercentage}%</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Sabor Promedio</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{kpis.avgFood}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">
            Distribución de Ratings
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating];
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-8">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <span className="text-xs font-medium text-card-foreground">{rating}</span>
                </div>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Todas las Reviews ({myReviews.length})
        </h3>
        {myReviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <p className="text-base font-semibold text-foreground">No hay reviews</p>
            <p className="text-sm text-muted-foreground">
              Aún no se han publicado reviews verificadas para tu restaurante
            </p>
          </div>
        ) : (
          myReviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {review.verified && <VerifiedBadge size="sm" />}
                      <p className="text-xs text-muted-foreground">
                        Por {review.userName} · {review.date}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                {review.categories && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-3">
                    {Object.entries(review.categories).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {key === "food" ? "Sabor" : key === "service" ? "Servicio" : key === "ambiance" ? "Ambiente" : "Precio-calidad"}
                        </span>
                        <span className="font-semibold text-card-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {review.tags.map((tag) => (
                      <TagPill key={tag}>{tag}</TagPill>
                    ))}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
