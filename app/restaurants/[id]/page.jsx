"use client";

import { use, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { isComensalLoggedIn } from "@/lib/auth";
import { RatingStars } from "@/components/truebite/rating-stars";
import { PriceRange } from "@/components/truebite/price-range";
import { TagPill } from "@/components/truebite/tag-pill";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { VerifiedBadge } from "@/components/truebite/verified-badge";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Clock,
  Phone,
  Instagram,
  Globe,
  BadgeCheck,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "info", label: "Info" },
  { id: "menu", label: "Menu" },
  { id: "reviews", label: "Reviews" },
];

export default function RestaurantDetailPage({ params }) {
  const { id } = use(params);
  const { getRestaurantById, getReviewsForRestaurant, user, toggleFavorite } =
    useAppStore();

  const [activeTab, setActiveTab] = useState("info");
  const [reviewSort, setReviewSort] = useState("recent");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isComensalLoggedIn());
  }, []);

  const restaurant = getRestaurantById(id);
  const restaurantReviews = getReviewsForRestaurant(id);
  const isFav = restaurant
    ? user.favoriteRestaurants.includes(restaurant.id)
    : false;

  const sortedReviews = useMemo(() => {
    const sorted = [...restaurantReviews];
    if (reviewSort === "recent") {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
  }, [restaurantReviews, reviewSort]);

  const menuByCategory = useMemo(() => {
    if (!restaurant?.menu) return {};
    return restaurant.menu.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [restaurant]);

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-lg font-medium text-foreground">
          Restaurante no encontrado
        </p>
        <Link href="/" className="text-sm text-primary underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Hero */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={restaurant.image || "/placeholder.svg"}
          alt={restaurant.name}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute left-4 top-4">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm transition-transform hover:scale-105"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Link>
        </div>

        <button
          onClick={() => toggleFavorite(restaurant.id)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm transition-transform hover:scale-105"
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isFav ? "fill-destructive text-destructive" : "text-foreground"
            )}
          />
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          {restaurant.verified && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
              <BadgeCheck className="h-3 w-3" />
              Verificado
            </span>
          )}
          <h1 className="text-2xl font-bold text-white font-serif">
            {restaurant.name}
          </h1>
          <p className="mt-0.5 text-sm text-white/80">
            {restaurant.cuisine} &middot; {restaurant.neighborhood}, {restaurant.city}
          </p>
        </div>
      </div>

      {/* Rating & Price */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <RatingStars rating={restaurant.rating} />
          <span className="text-base font-semibold text-foreground">
            {restaurant.rating}
          </span>
          <span className="text-sm text-muted-foreground">
            ({restaurant.reviewCount} reviews)
          </span>
        </div>
        <PriceRange level={restaurant.priceRange} />
      </div>

      {/* Verified notice */}
      <div className="mx-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground mb-0.5">
            Solo reviews verificadas
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Todas las opiniones provienen de comensales que realmente reservaron y asistieron. 
            Esto garantiza que las reviews son auténticas y confiables.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b px-4">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.id === "reviews" && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({restaurantReviews.length})
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-5 px-4 py-5">
        {/* INFO TAB */}
        {activeTab === "info" && (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {restaurant.description}
            </p>

            {/* Contact info card */}
            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm text-card-foreground">
                  {restaurant.address}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm text-card-foreground">
                  {restaurant.openHours}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm text-card-foreground">
                  {restaurant.phone}
                </span>
              </div>
              {restaurant.instagram && (
                <div className="flex items-center gap-3">
                  <Instagram className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-card-foreground">
                    {restaurant.instagram}
                  </span>
                </div>
              )}
              {restaurant.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visitar web
                  </a>
                </div>
              )}
            </div>

            {/* Map placeholder */}
            <div className="overflow-hidden rounded-2xl border bg-muted">
              <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="h-8 w-8" />
                <p className="text-sm font-medium">Mapa</p>
                <p className="text-xs">{restaurant.address}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {restaurant.tags.map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>

            {/* Cancellation policy */}
            {restaurant.cancellationPolicy && (
              <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold text-card-foreground">
                    Politica de cancelacion
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {restaurant.cancellationPolicy}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* MENU TAB */}
        {activeTab === "menu" && (
          <>
            {Object.keys(menuByCategory).length > 0 ? (
              <div className="flex flex-col gap-5">
                {Object.entries(menuByCategory).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </h3>
                    <div className="flex flex-col divide-y rounded-2xl border bg-card overflow-hidden">
                      {items.map((item, i) => (
                        <div
                          key={`${item.name}-${i}`}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <span className="text-sm text-card-foreground">
                            {item.name}
                          </span>
                          <span className="shrink-0 text-sm font-semibold text-foreground">
                            {item.price}{"EUR"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Menu no disponible todavia
                </p>
              </div>
            )}
          </>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <>
            {/* Sort controls */}
            {restaurantReviews.length > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {restaurantReviews.length} reviews verificadas
                </p>
                <button
                  onClick={() =>
                    setReviewSort(reviewSort === "recent" ? "best" : "recent")
                  }
                  className="flex items-center gap-1 text-xs font-medium text-primary"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {reviewSort === "recent" ? "Mas recientes" : "Mejor puntuadas"}
                </button>
              </div>
            )}

            {sortedReviews.length > 0 ? (
              <div className="flex flex-col gap-3">
                {sortedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border bg-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {review.userName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-card-foreground">
                          {review.userName}
                        </span>
                        {review.verified && <VerifiedBadge size="sm" />}
                      </div>
                      <RatingStars rating={review.rating} size="sm" />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                    {/* Category breakdown */}
                    {review.categories && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3">
                        {Object.entries(review.categories).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center gap-1 text-xs text-muted-foreground"
                            >
                              <span className="capitalize">
                                {key === "food"
                                  ? "Comida"
                                  : key === "service"
                                  ? "Servicio"
                                  : key === "ambiance"
                                  ? "Ambiente"
                                  : "Calidad-precio"}
                              </span>
                              <span className="font-semibold text-card-foreground">
                                {value}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      {review.date}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm font-medium text-foreground">
                  Aun no hay reviews
                </p>
                <p className="text-xs text-muted-foreground">
                  Se el primero en dejar una review verificada
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 z-30 border-t bg-background/90 px-4 py-3 backdrop-blur-lg">
        <PrimaryButton asChild>
          <Link href={loggedIn ? `/book/${restaurant.id}` : `/login?redirect=${encodeURIComponent(`/book/${restaurant.id}`)}`}>
            Reservar mesa
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </PrimaryButton>
      </div>
    </div>
  );
}
