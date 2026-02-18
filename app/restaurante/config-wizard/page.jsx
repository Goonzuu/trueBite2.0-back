"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { isRestauranteLoggedIn, getRestauranteRestaurantId } from "@/lib/auth";
import {
  createArea,
  createTimeRange,
  DAY_NAMES,
} from "@/lib/reservation-config";
import {
  validateOpeningHours,
  validateAreas,
  validateMaxCoherentWithAreas,
} from "@/lib/reservation-config-validation";
import { Clock, MapPin, Settings, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Horarios", icon: Clock },
  { id: 2, label: "Áreas", icon: MapPin },
  { id: 3, label: "Reglas", icon: Settings },
];

export default function ConfigWizardPage() {
  const router = useRouter();
  const restaurantId = getRestauranteRestaurantId();
  const {
    getRestaurantById,
    getRestaurantReservationConfig,
    setRestaurantReservationConfig,
    activateRestaurantReservations,
  } = useAppStore();

  const [step, setStep] = useState(1);
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
    setConfig((prev) => updater({ ...prev }));
  }

  function saveAndNext() {
    setRestaurantReservationConfig(restaurantId, config);
    if (step < 3) setStep(step + 1);
  }

  function handleActivate() {
    activateRestaurantReservations(restaurantId);
    router.push("/restaurante");
  }

  function toggleDayOpen(day) {
    updateConfig((c) => {
      const hours = { ...c.openingHours };
      if (hours[day]?.length > 0) {
        hours[day] = [];
      } else {
        hours[day] = [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")];
      }
      return { ...c, openingHours: hours };
    });
  }

  function updateDayRange(day, rangeIndex, field, value) {
    updateConfig((c) => {
      const hours = { ...c.openingHours };
      const ranges = [...(hours[day] || [])];
      if (!ranges[rangeIndex]) return c;
      ranges[rangeIndex] = { ...ranges[rangeIndex], [field]: value };
      hours[day] = ranges;
      return { ...c, openingHours: hours };
    });
  }

  function addDayRange(day) {
    updateConfig((c) => {
      const hours = { ...c.openingHours };
      const ranges = [...(hours[day] || []), createTimeRange("19:00", "23:00")];
      hours[day] = ranges;
      return { ...c, openingHours: hours };
    });
  }

  function removeDayRange(day, idx) {
    updateConfig((c) => {
      const hours = { ...c.openingHours };
      const ranges = (hours[day] || []).filter((_, i) => i !== idx);
      hours[day] = ranges;
      return { ...c, openingHours: hours };
    });
  }

  function copyToAllDays(sourceDay) {
    const source = config.openingHours[sourceDay];
    if (!source?.length) return;
    updateConfig((c) => {
      const hours = { ...c.openingHours };
      for (let d = 0; d <= 6; d++) {
        hours[d] = JSON.parse(JSON.stringify(source));
      }
      return { ...c, openingHours: hours };
    });
  }

  const hoursValidation = validateOpeningHours(config.openingHours);
  const areasValidation = validateAreas(config.areas);
  const maxCoherentValidation = validateMaxCoherentWithAreas(
    config.areas,
    config.rules?.maxPeoplePerReservation
  );
  const step1Valid = hoursValidation.valid;
  const step2Valid = areasValidation.valid && maxCoherentValidation.valid;

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground font-serif">
          Configuración de Reservas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {restaurant.name} · Completa para activar reservas automáticas
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                step === s.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Define cuándo recibes comensales. Puedes tener varios rangos por día (ej. mediodía y noche).
            </p>
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const ranges = config.openingHours[day] || [];
              const isOpen = ranges.length > 0;
              return (
                <div
                  key={day}
                  className="rounded-2xl border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-card-foreground">
                      {DAY_NAMES[day]}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToAllDays(day)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar a todos
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDayOpen(day)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          isOpen
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isOpen ? "Abierto" : "Cerrado"}
                      </button>
                    </div>
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
                            className="h-9 rounded-lg border bg-background px-2 text-sm"
                          />
                          <span className="text-muted-foreground">–</span>
                          <input
                            type="time"
                            value={range.close}
                            onChange={(e) =>
                              updateDayRange(day, idx, "close", e.target.value)
                            }
                            className="h-9 rounded-lg border bg-background px-2 text-sm"
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
            {!step1Valid && (
              <p className="text-xs text-destructive">
                {hoursValidation.message}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Define las zonas de tu restaurante y su capacidad.
            </p>
            {config.areas.map((area, idx) => (
              <div
                key={area.id}
                className="rounded-2xl border bg-card p-4"
              >
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
                    placeholder="Nombre del área"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig((c) => {
                        const areas = c.areas.map((a, i) =>
                          i === idx ? { ...a, enabled: !a.enabled } : a
                        );
                        return { ...c, areas };
                      })
                    }
                    className={cn(
                      "ml-2 rounded-full px-3 py-1 text-xs font-medium",
                      area.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
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
                            capacityPeople: Math.max(1, parseInt(e.target.value, 10) || 1),
                          };
                          return { ...c, areas };
                        })
                      }
                      className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Mín. personas</label>
                    <input
                      type="number"
                      min={1}
                      value={area.minPartySize}
                      onChange={(e) =>
                        updateConfig((c) => {
                          const areas = [...c.areas];
                          areas[idx] = {
                            ...areas[idx],
                            minPartySize: Math.max(1, parseInt(e.target.value, 10) || 1),
                          };
                          return { ...c, areas };
                        })
                      }
                      className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Máx. personas</label>
                    <input
                      type="number"
                      min={1}
                      value={area.maxPartySize}
                      onChange={(e) =>
                        updateConfig((c) => {
                          const areas = [...c.areas];
                          areas[idx] = {
                            ...areas[idx],
                            maxPartySize: Math.max(1, parseInt(e.target.value, 10) || 1),
                          };
                          return { ...c, areas };
                        })
                      }
                      className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm"
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
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary"
            >
              + Agregar área
            </button>
            {!areasValidation.valid && (
              <p className="text-xs text-destructive">{areasValidation.message}</p>
            )}
            {areasValidation.valid && !maxCoherentValidation.valid && (
              <p className="text-xs text-destructive">{maxCoherentValidation.message}</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground">
              Reglas que aplicarán a todas las reservas.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Duración estimada por reserva (min)
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
                        durationMinutes: Math.max(30, parseInt(e.target.value, 10) || 90),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Buffer entre reservas (min) <span className="text-muted-foreground">opcional</span>
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
                        bufferMinutes: Math.max(0, parseInt(e.target.value, 10) || 0),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
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
                        maxPeoplePerReservation: Math.max(1, parseInt(e.target.value, 10) || 12),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Modo de confirmación
                </label>
                <div className="mt-2 flex gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="confirmationMode"
                      checked={config.confirmationMode !== "manual"}
                      onChange={() =>
                        updateConfig((c) => ({ ...c, confirmationMode: "auto" }))
                      }
                      className="rounded-full"
                    />
                    <span className="text-sm">Automática (default)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="confirmationMode"
                      checked={config.confirmationMode === "manual"}
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
                <label className="text-sm font-medium text-foreground">
                  Antelación mínima para reservar (horas)
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
                        minAdvanceHours: Math.max(0, parseInt(e.target.value, 10) || 1),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {step < 3 ? (
          <PrimaryButton
            onClick={saveAndNext}
            disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
            className="w-full"
          >
            Continuar
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={handleActivate}
            className="w-full flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Activar reservas automáticas
          </PrimaryButton>
        )}
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="text-sm text-muted-foreground"
          >
            Atrás
          </button>
        )}
      </div>
    </div>
  );
}
