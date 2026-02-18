"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { isRestauranteLoggedIn, getRestauranteRestaurantId } from "@/lib/auth";
import {
  createTimeRange,
  createArea,
  DAY_NAMES,
} from "@/lib/reservation-config";
import { Clock, MapPin, Settings, LogOut, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "horarios", label: "Horarios", icon: Clock },
  { id: "areas", label: "Áreas", icon: MapPin },
  { id: "reglas", label: "Reglas", icon: Settings },
];

export default function DisponibilidadPage() {
  const router = useRouter();
  const restaurantId = getRestauranteRestaurantId();
  const {
    getRestaurantById,
    getRestaurantReservationConfig,
    setRestaurantReservationConfig,
    setRestaurantReservationsPaused,
  } = useAppStore();

  const [tab, setTab] = useState("horarios");
  const [config, setConfig] = useState(null);

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : null;

  useEffect(() => {
    if (!isRestauranteLoggedIn() || !restaurantId) {
      router.push("/restaurante/login");
      return;
    }
    const c = getRestaurantReservationConfig(restaurantId);
    setConfig(JSON.parse(JSON.stringify(c)));
  }, [restaurantId, router, getRestaurantReservationConfig]);

  if (!config || !restaurant) return null;

  function updateConfig(updater) {
    setConfig((prev) => {
      const next = updater({ ...prev });
      setRestaurantReservationConfig(restaurantId, next);
      return next;
    });
  }

  function togglePaused() {
    const next = !config.reservationsPaused;
    setRestaurantReservationsPaused(restaurantId, next);
    setConfig((c) => ({ ...c, reservationsPaused: next }));
  }

  function toggleDayOpen(day) {
    const hours = { ...config.openingHours };
    if (hours[day]?.length > 0) {
      hours[day] = [];
    } else {
      hours[day] = [
        createTimeRange("12:00", "15:00"),
        createTimeRange("19:00", "23:00"),
      ];
    }
    updateConfig((c) => ({ ...c, openingHours: hours }));
  }

  function updateDayRange(day, rangeIndex, field, value) {
    const hours = { ...config.openingHours };
    const ranges = [...(hours[day] || [])];
    if (!ranges[rangeIndex]) return;
    ranges[rangeIndex] = { ...ranges[rangeIndex], [field]: value };
    hours[day] = ranges;
    updateConfig((c) => ({ ...c, openingHours: hours }));
  }

  function addDayRange(day) {
    const hours = { ...config.openingHours };
    const ranges = [...(hours[day] || []), createTimeRange("19:00", "23:00")];
    hours[day] = ranges;
    updateConfig((c) => ({ ...c, openingHours: hours }));
  }

  function removeDayRange(day, idx) {
    const hours = { ...config.openingHours };
    hours[day] = (hours[day] || []).filter((_, i) => i !== idx);
    updateConfig((c) => ({ ...c, openingHours: hours }));
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/restaurante")}
            className="flex h-9 w-9 items-center justify-center rounded-full border"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground font-serif">
              Disponibilidad
            </h1>
            <p className="text-sm text-muted-foreground">
              Horarios, áreas y reglas de reserva
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-card-foreground">
              Aceptar reservas
            </p>
            <p className="text-xs text-muted-foreground">
              {config.reservationsPaused
                ? "Las reservas están pausadas"
                : "Los comensales pueden reservar"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!config.reservationsPaused}
            onClick={togglePaused}
            className={cn(
              "relative h-8 w-14 rounded-full transition-colors",
              config.reservationsPaused ? "bg-muted" : "bg-primary"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
                config.reservationsPaused ? "left-1" : "left-7"
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium",
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "horarios" && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const ranges = config.openingHours[day] || [];
            const isOpen = ranges.length > 0;
            return (
              <div key={day} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{DAY_NAMES[day]}</span>
                  <button
                    type="button"
                    onClick={() => toggleDayOpen(day)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      isOpen ? "bg-primary/10 text-primary" : "bg-muted"
                    )}
                  >
                    {isOpen ? "Abierto" : "Cerrado"}
                  </button>
                </div>
                {isOpen && (
                  <div className="flex flex-col gap-2">
                    {ranges.map((range, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={range.open}
                          onChange={(e) =>
                            updateDayRange(day, idx, "open", e.target.value)
                          }
                          className="h-9 rounded-lg border px-2 text-sm"
                        />
                        <span className="text-muted-foreground">–</span>
                        <input
                          type="time"
                          value={range.close}
                          onChange={(e) =>
                            updateDayRange(day, idx, "close", e.target.value)
                          }
                          className="h-9 rounded-lg border px-2 text-sm"
                        />
                        {ranges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDayRange(day, idx)}
                            className="text-xs text-destructive"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addDayRange(day)}
                      className="self-start text-xs font-medium text-primary"
                    >
                      + Añadir turno
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "areas" && (
        <div className="flex flex-col gap-3">
          {config.areas.map((area, idx) => (
            <div key={area.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={area.name}
                  onChange={(e) =>
                    updateConfig((c) => {
                      const areas = [...c.areas];
                      areas[idx] = { ...areas[idx], name: e.target.value };
                      return { ...c, areas };
                    })
                  }
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateConfig((c) => ({
                      ...c,
                      areas: c.areas.map((a, i) =>
                        i === idx ? { ...a, enabled: !a.enabled } : a
                      ),
                    }))
                  }
                  className={cn(
                    "ml-2 rounded-full px-3 py-1 text-xs font-medium",
                    area.enabled ? "bg-primary/10 text-primary" : "bg-muted"
                  )}
                >
                  {area.enabled ? "Activa" : "Inactiva"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Capacidad</label>
                  <input
                    type="number"
                    min={1}
                    value={area.capacityPeople}
                    onChange={(e) =>
                      updateConfig((c) => {
                        const areas = [...c.areas];
                        areas[idx] = {
                          ...areas[idx],
                          capacityPeople: Math.max(
                            1,
                            parseInt(e.target.value, 10) || 1
                          ),
                        };
                        return { ...c, areas };
                      })
                    }
                    className="w-full rounded-lg border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Mín.</label>
                  <input
                    type="number"
                    min={1}
                    value={area.minPartySize}
                    onChange={(e) =>
                      updateConfig((c) => {
                        const areas = [...c.areas];
                        areas[idx] = {
                          ...areas[idx],
                          minPartySize: Math.max(
                            1,
                            parseInt(e.target.value, 10) || 1
                          ),
                        };
                        return { ...c, areas };
                      })
                    }
                    className="w-full rounded-lg border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Máx.</label>
                  <input
                    type="number"
                    min={1}
                    value={area.maxPartySize}
                    onChange={(e) =>
                      updateConfig((c) => {
                        const areas = [...c.areas];
                        areas[idx] = {
                          ...areas[idx],
                          maxPartySize: Math.max(
                            1,
                            parseInt(e.target.value, 10) || 1
                          ),
                        };
                        return { ...c, areas };
                      })
                    }
                    className="w-full rounded-lg border px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updateConfig((c) => ({
                ...c,
                areas: [...c.areas, createArea({ name: "Nueva área" })],
              }))
            }
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium text-muted-foreground"
          >
            + Agregar área
          </button>
        </div>
      )}

      {tab === "reglas" && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">
              Modo de confirmación
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={(config.confirmationMode || "auto") !== "manual"}
                  onChange={() =>
                    updateConfig((c) => ({ ...c, confirmationMode: "auto" }))
                  }
                  className="rounded-full"
                />
                <span className="text-sm">Automática</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={(config.confirmationMode || "auto") === "manual"}
                  onChange={() =>
                    updateConfig((c) => ({ ...c, confirmationMode: "manual" }))
                  }
                  className="rounded-full"
                />
                <span className="text-sm">Manual (requiere confirmar)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">
              Duración por reserva (min)
            </label>
            <input
              type="number"
              min={30}
              max={240}
              step={15}
              value={config.rules.durationMinutes}
              onChange={(e) =>
                updateConfig((c) => ({
                  ...c,
                  rules: {
                    ...c.rules,
                    durationMinutes: Math.max(
                      30,
                      parseInt(e.target.value, 10) || 90
                    ),
                  },
                }))
              }
              className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Buffer entre reservas (min)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={config.rules.bufferMinutes}
              onChange={(e) =>
                updateConfig((c) => ({
                  ...c,
                  rules: {
                    ...c.rules,
                    bufferMinutes: Math.max(
                      0,
                      parseInt(e.target.value, 10) || 0
                    ),
                  },
                }))
              }
              className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Máximo personas por reserva
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={config.rules.maxPeoplePerReservation}
              onChange={(e) =>
                updateConfig((c) => ({
                  ...c,
                  rules: {
                    ...c.rules,
                    maxPeoplePerReservation: Math.max(
                      1,
                      parseInt(e.target.value, 10) || 12
                    ),
                  },
                }))
              }
              className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Antelación mínima (horas)
            </label>
            <input
              type="number"
              min={0}
              max={72}
              value={config.rules.minAdvanceHours}
              onChange={(e) =>
                updateConfig((c) => ({
                  ...c,
                  rules: {
                    ...c.rules,
                    minAdvanceHours: Math.max(
                      0,
                      parseInt(e.target.value, 10) || 1
                    ),
                  },
                }))
              }
              className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
