"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComensalGuard } from "@/components/auth/comensal-guard";
import { logoutComensal } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/truebite/rating-stars";
import { PrimaryButton } from "@/components/truebite/primary-button";
import {
  CalendarDays,
  MessageSquare,
  Heart,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  BadgeCheck,
  Star,
  Gift,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, restaurants, reviews, getActiveUserBenefits } = useAppStore();

  const userReviews = reviews.filter((r) => r.userId === user.id);
  const activeBenefits = getActiveUserBenefits();
  const favoriteRestaurants = restaurants.filter((r) =>
    user.favoriteRestaurants.includes(r.id)
  );

  const menuItems = [
    { icon: Settings, label: "Configuracion", href: "#", onClick: null },
    { icon: HelpCircle, label: "Ayuda y soporte", href: "#", onClick: null },
    { icon: LogOut, label: "Cerrar sesion", href: "#", destructive: true, onClick: () => { logoutComensal(); router.replace("/"); } },
  ];

  return (
    <ComensalGuard>
    <div className="flex flex-col gap-6 px-4 py-4">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 shadow-sm">
        <Avatar className="h-20 w-20 border-4 border-primary/20">
          <AvatarImage src="/avatar.jpg" alt={user.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-xl font-bold text-card-foreground font-serif">
            {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3 w-3 text-primary" />
            Miembro desde{" "}
            {new Date(user.memberSince).toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Mis beneficios */}
      {activeBenefits.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Mis beneficios
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Regalos de los restaurantes para tu próxima visita. Reserva por TrueBite para disfrutarlos. Válidos 30 días.
          </p>
          <div className="flex flex-col gap-3">
            {activeBenefits.map((ub) => {
              const r = restaurants.find((x) => x.id === ub.restaurantId);
              const expiresAt = ub.expiresAt ? new Date(ub.expiresAt) : null;
              const now = new Date();
              const daysLeft = expiresAt
                ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
                : null;
              const isUrgent = daysLeft !== null && daysLeft <= 7;

              return (
                <Link
                  key={ub.id}
                  href={`/book/${ub.restaurantId}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]",
                    isUrgent
                      ? "border-accent/50 bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5"
                      : "border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-card"
                  )}
                >
                  <div className="flex items-stretch gap-0">
                    {r && (
                      <div className="relative w-24 shrink-0 overflow-hidden">
                        <img
                          src={r.image || "/placeholder.svg"}
                          alt={r.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20" />
                        <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm">
                          <Gift className="h-4 w-4 text-accent-foreground" />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                      <div>
                        <p className="font-semibold text-card-foreground">
                          {r?.name || "Restaurante"}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-accent-foreground">
                          {ub.benefit}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                            isUrgent
                              ? "bg-accent/30 text-accent-foreground"
                              : "bg-accent/20 text-accent-foreground/90"
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          {daysLeft !== null ? (
                            daysLeft === 0 ? (
                              "Vence hoy"
                            ) : daysLeft === 1 ? (
                              "1 día"
                            ) : (
                              `${daysLeft} días`
                            )
                          ) : (
                            "Válido"
                          )}
                        </div>
                        <PrimaryButton size="sm" className="shrink-0">
                          Reservar
                          <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </PrimaryButton>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-4">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="text-xl font-bold text-card-foreground">
            {user.totalReservations}
          </span>
          <span className="text-xs text-muted-foreground">Reservas</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-4">
          <Star className="h-5 w-5 text-accent" />
          <span className="text-xl font-bold text-card-foreground">
            {user.totalReviews}
          </span>
          <span className="text-xs text-muted-foreground">Reviews</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-4">
          <Heart className="h-5 w-5 text-destructive" />
          <span className="text-xl font-bold text-card-foreground">
            {user.favoriteRestaurants.length}
          </span>
          <span className="text-xs text-muted-foreground">Favoritos</span>
        </div>
      </div>

      {/* Favorites */}
      {favoriteRestaurants.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Favoritos
          </h2>
          <div className="flex flex-col gap-2">
            {favoriteRestaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-sm"
              >
                <img
                  src={r.image || "/placeholder.svg"}
                  alt={r.name}
                  className="h-11 w-11 rounded-lg object-cover shrink-0"
                  crossOrigin="anonymous"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {r.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <RatingStars rating={r.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {r.rating}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent reviews */}
      {userReviews.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Mis reviews recientes
          </h2>
          <div className="flex flex-col gap-2">
            {userReviews.map((review) => {
              const r = restaurants.find(
                (rest) => rest.id === review.restaurantId
              );
              return (
                <div
                  key={review.id}
                  className="flex flex-col gap-2 rounded-xl border bg-card p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-card-foreground">
                      {r?.name || "Restaurante"}
                    </span>
                    <RatingStars rating={review.rating} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {review.comment}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                    <BadgeCheck className="h-3 w-3 text-primary" />
                    Review verificada - {review.date}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Menu */}
      <section>
        <div className="flex flex-col rounded-2xl border bg-card overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick ?? undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-muted/50 w-full",
                  index > 0 && "border-t",
                  item.destructive
                    ? "text-destructive"
                    : "text-card-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
    </ComensalGuard>
  );
}
