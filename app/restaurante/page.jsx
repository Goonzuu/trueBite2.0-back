"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { TagPill } from "@/components/truebite/tag-pill";
import { PrimaryButton } from "@/components/truebite/primary-button";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CircleDot,
  LogOut,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isRestauranteLoggedIn, logoutRestaurante, getRestauranteRestaurantId } from "@/lib/auth";

const statusConfig = {
  PENDING_CONFIRMATION: {
    label: "Pendiente",
    icon: Clock,
    className: "text-accent-foreground bg-accent/15",
  },
  CONFIRMED: {
    label: "Confirmada",
    icon: CheckCircle2,
    className: "text-primary bg-primary/10",
  },
  COMPLETED: {
    label: "Completada",
    icon: CircleDot,
    className: "text-muted-foreground bg-muted",
  },
  NO_SHOW: {
    label: "No asistió",
    icon: AlertTriangle,
    className: "text-destructive bg-destructive/10",
  },
  CANCELED: {
    label: "Cancelada",
    icon: XCircle,
    className: "text-muted-foreground bg-muted",
  },
};

export default function RestauranteDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const restaurantId = getRestauranteRestaurantId();
  const { reservations, restaurants, cancelReservation, confirmReservation, markReservationCompleted, markReservationNoShow, updateRestaurantBenefit, setRestaurantReservationConfig, setRestaurantReservationsPaused } = useAppStore();
  const wizardCompleted = useAppStore(
    (s) => s.getRestaurantReservationConfig(restaurantId)?.wizardCompleted
  );
  const config = useAppStore((s) => s.getRestaurantReservationConfig(restaurantId));
  const [selectedStatus, setSelectedStatus] = useState("Todas");
  const [selectedRestaurant, setSelectedRestaurant] = useState("Todos");
  const [sortBy, setSortBy] = useState("date");
  const [completingReservationId, setCompletingReservationId] = useState(null);
  const [configRestaurantId, setConfigRestaurantId] = useState("");
  const [configBenefit, setConfigBenefit] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isRestauranteLoggedIn()) {
      router.push("/restaurante/login");
      return;
    }
    if (!restaurantId) {
      router.push("/restaurante/login");
      return;
    }
    if (!wizardCompleted) {
      router.push("/restaurante/config-wizard");
      return;
    }
  }, [mounted, router, restaurantId, wizardCompleted]);

  useEffect(() => {
    if (mounted && restaurantId) {
      setSelectedRestaurant(restaurantId);
      setConfigRestaurantId(restaurantId);
    }
  }, [mounted, restaurantId]);

  useEffect(() => {
    if (restaurantId && configRestaurantId === restaurantId) {
      const r = restaurants.find((x) => x.id === restaurantId);
      if (r?.benefit) setConfigBenefit((prev) => prev || r.benefit);
    }
  }, [restaurantId, configRestaurantId, restaurants]);

  const statusOptions = ["Todas", ...Object.keys(statusConfig)];
  const restaurantOptions = useMemo(() => {
    const mine = restaurantId ? reservations.filter((r) => r.restaurantId === restaurantId) : reservations;
    const unique = [...new Set(mine.map((r) => r.restaurantId))];
    return restaurantId ? unique : ["Todos", ...unique];
  }, [reservations, restaurantId]);

  const filteredReservations = useMemo(() => {
    let filtered = restaurantId
      ? reservations.filter((r) => r.restaurantId === restaurantId)
      : [...reservations];
    if (selectedStatus !== "Todas") {
      filtered = filtered.filter((r) => r.status === selectedStatus);
    }
    if (selectedRestaurant && selectedRestaurant !== "Todos") {
      filtered = filtered.filter((r) => r.restaurantId === selectedRestaurant);
    }
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date + "T" + b.time) - new Date(a.date + "T" + a.time);
      }
      return b.id.localeCompare(a.id);
    });
    return filtered;
  }, [reservations, selectedStatus, selectedRestaurant, sortBy, restaurantId]);

  const myReservations = useMemo(() => {
    return restaurantId ? reservations.filter((r) => r.restaurantId === restaurantId) : reservations;
  }, [reservations, restaurantId]);

  const stats = useMemo(() => ({
    total: myReservations.length,
    pending: myReservations.filter((r) => r.status === "PENDING_CONFIRMATION").length,
    confirmed: myReservations.filter((r) => r.status === "CONFIRMED").length,
    completed: myReservations.filter((r) => r.status === "COMPLETED").length,
  }), [myReservations]);

  if (!mounted) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  function handleConfirm(reservationId) {
    confirmReservation(reservationId);
    toast.success("Reserva confirmada");
  }

  function handleReject(reservationId) {
    cancelReservation(reservationId);
    toast.success("Reserva rechazada");
  }

  function handleMarkCompleted(reservationId) {
    markReservationCompleted(reservationId);
    setCompletingReservationId(null);
    toast.success("Asistencia registrada");
  }

  function handleSaveRestaurantBenefit() {
    if (!configRestaurantId) return;
    updateRestaurantBenefit(configRestaurantId, configBenefit);
    toast.success("Beneficio actualizado");
    setConfigRestaurantId("");
    setConfigBenefit("");
  }

  function handleMarkNoShow(reservationId) {
    markReservationNoShow(reservationId);
    toast.success("No show registrado");
  }

  function handleLogout() {
    logoutRestaurante();
    localStorage.removeItem("truebite_admin");
    toast.success("Sesión cerrada");
    router.push("/restaurante/login");
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">
            Gestión de Reservas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirma, marca asistencia y gestiona tu agenda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrimaryButton size="sm" onClick={() => router.push("/restaurante/disponibilidad")}>
            Disponibilidad
          </PrimaryButton>
          <button
            onClick={() => router.push("/restaurante/reviews")}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            Reviews
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Configuración de reservas
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Controla cómo recibes reservas y si se confirman automáticamente o requieren tu aprobación.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl border bg-background/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Aceptar reservas</p>
              <p className="text-xs text-muted-foreground">
                {config?.reservationsPaused ? "Pausadas" : "Activas"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!config?.reservationsPaused}
              onClick={() => setRestaurantReservationsPaused(restaurantId, !config?.reservationsPaused)}
              className={cn(
                "relative h-8 w-14 rounded-full transition-colors shrink-0",
                config?.reservationsPaused ? "bg-muted" : "bg-primary"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  config?.reservationsPaused ? "left-1" : "left-7"
                )}
              />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Modo de confirmación</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={(config?.confirmationMode || "auto") !== "manual"}
                  onChange={() => {
                    const c = useAppStore.getState().getRestaurantReservationConfig(restaurantId);
                    setRestaurantReservationConfig(restaurantId, { ...c, confirmationMode: "auto" });
                  }}
                  className="rounded-full"
                />
                <span className="text-sm">Automática</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={(config?.confirmationMode || "auto") === "manual"}
                  onChange={() => {
                    const c = useAppStore.getState().getRestaurantReservationConfig(restaurantId);
                    setRestaurantReservationConfig(restaurantId, { ...c, confirmationMode: "manual" });
                  }}
                  className="rounded-full"
                />
                <span className="text-sm">Manual (requiere confirmar)</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {(config?.confirmationMode || "auto") === "auto"
                ? "Las reservas se confirman al instante."
                : "Las reservas quedan pendientes hasta que las confirmes."}
            </p>
          </div>
          <Link
            href="/restaurante/disponibilidad"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver horarios, áreas y reglas en Disponibilidad →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Beneficio para clientes recurrentes
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Configura un beneficio opcional que se otorga automáticamente cuando el comensal deje su review. Ej: &quot;Postre gratis en tu próxima visita&quot;
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Restaurante</label>
            <select
              value={configRestaurantId}
              onChange={(e) => {
                setConfigRestaurantId(e.target.value);
                const r = restaurants.find((x) => x.id === e.target.value);
                setConfigBenefit(r?.benefit || "");
              }}
              className="w-full h-9 rounded-xl border bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="">Seleccionar restaurante</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.benefit ? `(${r.benefit})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Beneficio (opcional)</label>
            <input
              type="text"
              value={configBenefit}
              onChange={(e) => setConfigBenefit(e.target.value)}
              placeholder="ej: Postre gratis en tu próxima visita"
              className="w-full h-9 rounded-xl border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <PrimaryButton size="sm" onClick={handleSaveRestaurantBenefit} disabled={!configRestaurantId}>
            Guardar
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-accent-foreground">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Confirmadas</p>
          <p className="text-2xl font-bold text-primary">{stats.confirmed}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Completadas</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.completed}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-muted-foreground">Estado</label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {statusOptions.map((status) => (
            <TagPill
              key={status}
              active={selectedStatus === status}
              onClick={() => setSelectedStatus(status)}
            >
              {status === "Todas" ? "Todas" : statusConfig[status]?.label || status}
            </TagPill>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border bg-card px-3 py-1.5 text-xs text-card-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="date">Fecha más reciente</option>
            <option value="id">ID</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <p className="text-base font-semibold text-foreground">No hay reservas</p>
            <p className="text-sm text-muted-foreground">
              No se encontraron reservas con los filtros seleccionados
            </p>
          </div>
        ) : (
          filteredReservations.map((reservation) => {
            const restaurant = restaurants.find((r) => r.id === reservation.restaurantId);
            const status = statusConfig[reservation.status] || statusConfig.COMPLETED;
            const StatusIcon = status.icon;

            return (
              <div key={reservation.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  {restaurant && (
                    <img
                      src={restaurant.image || "/placeholder.svg"}
                      alt={restaurant.name}
                      className="h-14 w-14 rounded-xl object-cover shrink-0"
                      crossOrigin="anonymous"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-card-foreground">
                          {restaurant?.name || "Restaurante"}
                        </p>
                        <p className="text-xs text-muted-foreground">ID: {reservation.id}</p>
                      </div>
                      <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
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
                    {reservation.guests} {reservation.guests === 1 ? "persona" : "personas"}
                  </span>
                </div>

                {reservation.notes && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                    {reservation.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {reservation.status === "PENDING_CONFIRMATION" && (
                    <>
                      <PrimaryButton size="sm" onClick={() => handleConfirm(reservation.id)}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Confirmar
                      </PrimaryButton>
                      <button
                        onClick={() => handleReject(reservation.id)}
                        className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Rechazar
                      </button>
                    </>
                  )}

                  {reservation.status === "CONFIRMED" && (
                    <>
                      {completingReservationId === reservation.id ? (
                        <div className="flex gap-2">
                          <PrimaryButton size="sm" onClick={() => handleMarkCompleted(reservation.id)}>
                            Confirmar asistencia
                          </PrimaryButton>
                          <button
                            onClick={() => setCompletingReservationId(null)}
                            className="rounded-xl border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <PrimaryButton size="sm" onClick={() => setCompletingReservationId(reservation.id)}>
                            <CircleDot className="mr-1 h-3.5 w-3.5" />
                            Marcar asistencia
                          </PrimaryButton>
                          <button
                            onClick={() => handleMarkNoShow(reservation.id)}
                            className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            No show
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {reservation.status === "COMPLETED" && reservation.reviewEnabled && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Review habilitada
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
