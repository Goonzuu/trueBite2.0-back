"use client";

import { useState, useMemo, useEffect } from "react";
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
  TrendingUp,
  Star,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export default function AdminDashboard() {
  const router = useRouter();
  const { reservations, restaurants, cancelReservation, confirmReservation, markReservationCompleted, markReservationNoShow, updateRestaurantBenefit } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState("Todas");
  const [selectedRestaurant, setSelectedRestaurant] = useState("Todos");
  const [sortBy, setSortBy] = useState("date");
  const [completingReservationId, setCompletingReservationId] = useState(null);
  const [configRestaurantId, setConfigRestaurantId] = useState("");
  const [configBenefit, setConfigBenefit] = useState("");

  // Verificar autenticación
  useEffect(() => {
    const admin = localStorage.getItem("truebite_admin");
    if (!admin) {
      router.push("/admin/login");
    }
  }, [router]);

  const statusOptions = ["Todas", ...Object.keys(statusConfig)];

  const restaurantOptions = useMemo(() => {
    const unique = [...new Set(reservations.map((r) => r.restaurantId))];
    return ["Todos", ...unique];
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Filtrar por estado
    if (selectedStatus !== "Todas") {
      filtered = filtered.filter((r) => r.status === selectedStatus);
    }

    // Filtrar por restaurante
    if (selectedRestaurant !== "Todos") {
      filtered = filtered.filter((r) => r.restaurantId === selectedRestaurant);
    }

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date + "T" + b.time) - new Date(a.date + "T" + a.time);
      }
      return b.id.localeCompare(a.id);
    });

    return filtered;
  }, [reservations, selectedStatus, selectedRestaurant, sortBy]);

  function handleConfirm(reservationId) {
    confirmReservation(reservationId);
    toast.success("Reserva confirmada", {
      description: "La reserva ha sido confirmada exitosamente",
    });
  }

  function handleReject(reservationId) {
    cancelReservation(reservationId);
    toast.success("Reserva rechazada", {
      description: "La reserva ha sido cancelada",
    });
  }

  function handleMarkCompleted(reservationId) {
    markReservationCompleted(reservationId);
    setCompletingReservationId(null);
    toast.success("Asistencia registrada", {
      description: "El usuario puede dejar review. Si el restaurante tiene beneficio configurado, lo recibirá al votar.",
    });
  }

  function handleSaveRestaurantBenefit() {
    if (!configRestaurantId) return;
    updateRestaurantBenefit(configRestaurantId, configBenefit);
    toast.success("Beneficio actualizado", {
      description: "Se otorgará automáticamente cuando el usuario deje su review.",
    });
    setConfigRestaurantId("");
    setConfigBenefit("");
  }

  function handleMarkNoShow(reservationId) {
    markReservationNoShow(reservationId);
    toast.success("No show registrado", {
      description: "La reserva ha sido marcada como no asistida",
    });
  }

  function handleLogout() {
    localStorage.removeItem("truebite_admin");
    toast.success("Sesión cerrada");
    router.push("/admin/login");
  }

  const stats = useMemo(() => {
    return {
      total: reservations.length,
      pending: reservations.filter((r) => r.status === "PENDING_CONFIRMATION").length,
      confirmed: reservations.filter((r) => r.status === "CONFIRMED").length,
      completed: reservations.filter((r) => r.status === "COMPLETED").length,
    };
  }, [reservations]);

  return (
    <div className="flex flex-col gap-6 px-4 py-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">
            Panel de Administración
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona reservas y reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrimaryButton
            size="sm"
            onClick={() => router.push("/admin/reviews")}
          >
            Ver Reviews
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

      {/* Configuración: beneficio por restaurante */}
      <div className="rounded-2xl border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Beneficio para clientes recurrentes
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Configura un beneficio opcional que se otorga automáticamente cuando el usuario deje su review. Ej: &quot;Postre gratis en tu próxima visita&quot;
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
          <PrimaryButton
            size="sm"
            onClick={handleSaveRestaurantBenefit}
            disabled={!configRestaurantId}
          >
            Guardar
          </PrimaryButton>
        </div>
      </div>

      {/* Stats */}
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

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
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

      {/* Reservations list */}
      <div className="flex flex-col gap-3">
        {filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <p className="text-base font-semibold text-foreground">
              No hay reservas
            </p>
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
              <div
                key={reservation.id}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-4"
              >
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
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          status.className
                        )}
                      >
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

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {reservation.status === "PENDING_CONFIRMATION" && (
                    <>
                      <PrimaryButton
                        size="sm"
                        onClick={() => handleConfirm(reservation.id)}
                      >
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
                          <PrimaryButton
                            size="sm"
                            onClick={() => handleMarkCompleted(reservation.id)}
                          >
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
                          <PrimaryButton
                            size="sm"
                            onClick={() => setCompletingReservationId(reservation.id)}
                          >
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
