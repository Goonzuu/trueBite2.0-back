/**
 * Modelo de configuración de reservas por restaurante.
 * Diseñado para ser extensible (mesas, planos, etc.) en fases futuras.
 */

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** Horario de apertura: { open: "12:00", close: "15:00" } */
export function createTimeRange(open = "12:00", close = "15:00") {
  return { open, close };
}

/** Horario por día: 0=domingo, 6=sábado */
export function createOpeningHours() {
  return {
    0: [], // Domingo cerrado por defecto
    1: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")],
    2: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")],
    3: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")],
    4: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")],
    5: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:30")],
    6: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:30")],
  };
}

/** Área del restaurante */
export function createArea(overrides = {}) {
  return {
    id: `area-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: "Interior",
    enabled: true,
    capacityPeople: 40,
    minPartySize: 1,
    maxPartySize: 8,
    ...overrides,
  };
}

/** Config por defecto de un restaurante (sin completar wizard) */
export function createDefaultConfig(restaurantId) {
  return {
    restaurantId,
    reservationsEnabled: false,
    reservationsPaused: false,
    wizardCompleted: false,
    openingHours: createOpeningHours(),
    areas: [createArea({ name: "Interior" }), createArea({ name: "Exterior", capacityPeople: 20 })],
    rules: {
      durationMinutes: 90,
      bufferMinutes: 10,
      maxPeoplePerReservation: 12,
      minAdvanceHours: 1,
    },
    confirmationMode: "auto", // "auto" | "manual"
  };
}

export { DAY_NAMES };
