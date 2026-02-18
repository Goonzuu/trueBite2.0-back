"use client";

import { useState } from "react";
import Link from "next/link";
import { ComensalGuard } from "@/components/auth/comensal-guard";
import { useAppStore } from "@/lib/store";
import { RatingStars } from "@/components/truebite/rating-stars";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { VerifiedBadge } from "@/components/truebite/verified-badge";
import {
  CalendarDays,
  Clock,
  Users,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Loader2,
  CircleDot,
  XCircle,
  AlertTriangle,
  CalendarX,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  PENDING_CONFIRMATION: {
    label: "Pendiente de confirmación",
    hint: "El restaurante confirmará pronto",
    icon: Loader2,
    className: "text-accent-foreground bg-accent/15",
  },
  CONFIRMED: {
    label: "Confirmada ✅",
    hint: null,
    icon: CheckCircle2,
    className: "text-primary bg-primary/10",
  },
  COMPLETED: {
    label: "Completada",
    hint: null,
    icon: CircleDot,
    className: "text-primary bg-primary/10",
  },
  NO_SHOW: {
    label: "No asistio",
    hint: null,
    icon: AlertTriangle,
    className: "text-destructive bg-destructive/10",
  },
  CANCELED: {
    label: "Cancelada",
    hint: null,
    icon: XCircle,
    className: "text-muted-foreground bg-muted",
  },
};

const TAB_OPTIONS = [
  { id: "upcoming", label: "Proximas" },
  { id: "past", label: "Pasadas" },
];

function ReservationCard({ reservation }) {
  const { getRestaurantById, cancelReservation } = useAppStore();
  const restaurant = getRestaurantById(reservation.restaurantId);
  if (!restaurant) return null;

  const status = statusConfig[reservation.status] || statusConfig.COMPLETED;
  const StatusIcon = status.icon;

  const isPending = reservation.status === "PENDING_CONFIRMATION";
  const isConfirmed = reservation.status === "CONFIRMED";
  const isCompleted = reservation.status === "COMPLETED";
  const isCanceled = reservation.status === "CANCELED";
  const isNoShow = reservation.status === "NO_SHOW";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all",
        (isCanceled || isNoShow) && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <img
          src={restaurant.image || "/placeholder.svg"}
          alt={restaurant.name}
          className="h-14 w-14 rounded-xl object-cover shrink-0"
          crossOrigin="anonymous"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/restaurants/${restaurant.id}`}
              className="truncate text-sm font-semibold text-card-foreground hover:text-primary transition-colors"
            >
              {restaurant.name}
            </Link>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                status.className
              )}
            >
              <StatusIcon className={cn("h-3 w-3", isPending && "animate-spin")} />
              {status.label}
            </span>
          </div>
          {status.hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {status.hint}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1">
            <RatingStars rating={restaurant.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {restaurant.rating}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(reservation.date).toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {reservation.time}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {reservation.guests}{" "}
          {reservation.guests === 1 ? "persona" : "personas"}
        </span>
      </div>

      {reservation.notes && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
          {reservation.notes}
        </p>
      )}

      {/* Action area */}
      {isPending && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-accent/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 shrink-0 text-accent-foreground animate-spin" />
            <p className="text-xs font-medium text-accent-foreground">
              Esperando confirmación del restaurante
            </p>
          </div>
          <p className="text-[10px] text-accent-foreground/80 pl-5">
            El restaurante revisará tu solicitud. Te notificaremos cuando respondan.
          </p>
        </div>
      )}

      {isConfirmed && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-xs font-medium text-primary">
              ¡Reserva confirmada! Tu mesa está lista.
            </p>
          </div>
          <div className="flex gap-2">
            <PrimaryButton size="sm" asChild className="flex-1">
              <Link href={`/restaurants/${restaurant.id}`}>
                Ver detalles
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </PrimaryButton>
            <button
              onClick={() => cancelReservation(reservation.id)}
              className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isCompleted && !reservation.reviewed && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-1.5">
            <CircleDot className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-xs font-medium text-primary">
              Visita completada. ¡Deja tu opinión verificada!
            </p>
          </div>
          <PrimaryButton size="sm" asChild>
            <Link href={`/review/${reservation.id}`}>
              Dejar review verificada
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </PrimaryButton>
        </div>
      )}

      {isCompleted && reservation.reviewed && (
        <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-xs font-medium text-primary">
            Review verificada publicada. ¡Gracias por tu opinión!
          </p>
        </div>
      )}

      {isNoShow && (
        <p className="text-xs text-destructive/80">
          No se registro tu asistencia a esta reserva.
        </p>
      )}

      {isCanceled && reservation.notes && (
        <p className="text-xs text-muted-foreground italic">
          Motivo: {reservation.notes}
        </p>
      )}
    </div>
  );
}

export default function ReservationsPage() {
  const { reservations } = useAppStore();
  const [activeTab, setActiveTab] = useState("upcoming");

  const upcoming = reservations.filter(
    (r) => r.status === "CONFIRMED" || r.status === "PENDING_CONFIRMATION"
  );
  const past = reservations.filter(
    (r) =>
      r.status === "COMPLETED" ||
      r.status === "NO_SHOW" ||
      r.status === "CANCELED"
  );

  const currentList = activeTab === "upcoming" ? upcoming : past;

  return (
    <ComensalGuard>
    <div className="flex flex-col gap-6 px-4 py-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-serif">
          Mis reservas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona tus reservas y comparte tu experiencia con reviews verificadas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-secondary p-1">
        {TAB_OPTIONS.map((tab) => {
          const count = tab.id === "upcoming" ? upcoming.length : past.length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {reservations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <CalendarDays className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            No tienes reservas
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Explora restaurantes y haz tu primera reserva
          </p>
          <PrimaryButton className="max-w-xs" asChild>
            <Link href="/">
              <Compass className="mr-1.5 h-4 w-4" />
              Explorar
            </Link>
          </PrimaryButton>
        </div>
      ) : currentList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <CalendarX className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">
            {activeTab === "upcoming"
              ? "No tienes reservas proximas"
              : "No tienes reservas anteriores"}
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {activeTab === "upcoming"
              ? "Descubre nuevos restaurantes y reserva tu proxima mesa"
              : "Aqui apareceran tus reservas completadas, canceladas o no asistidas"}
          </p>
          {activeTab === "upcoming" && (
            <Link
              href="/"
              className="mt-1 text-sm font-medium text-primary hover:underline"
            >
              Explorar restaurantes
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {currentList.map((res) => (
            <ReservationCard key={res.id} reservation={res} />
          ))}
        </div>
      )}
    </div>
    </ComensalGuard>
  );
}
