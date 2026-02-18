/**
 * Lógica de disponibilidad de reservas.
 * Calcula slots disponibles reales según horarios, áreas y reservas existentes.
 */


/** Convierte "HH:mm" a minutos desde medianoche */
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/** Convierte minutos a "HH:mm" */
function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Genera slots posibles dentro de un rango horario.
 * El intervalo entre slots = duration + buffer para evitar solapamientos.
 * @param {string} open - "12:00"
 * @param {string} close - "15:00"
 * @param {number} durationMinutes - 90
 * @param {number} bufferMinutes - 10
 * @returns {string[]}
 */
function generateSlotsInRange(open, close, durationMinutes, bufferMinutes = 0) {
  const openMins = toMinutes(open);
  const closeMins = toMinutes(close);
  const slotInterval = durationMinutes + bufferMinutes;
  const slots = [];
  for (let start = openMins; start + durationMinutes <= closeMins; start += slotInterval) {
    slots.push(fromMinutes(start));
  }
  return slots;
}

/**
 * Obtiene todos los slots potenciales de un día según horarios de atención.
 */
function getPotentialSlotsForDay(openingHours, dayOfWeek, durationMinutes, bufferMinutes = 0) {
  const ranges = openingHours[dayOfWeek] || [];
  const allSlots = [];
  for (const range of ranges) {
    const slots = generateSlotsInRange(
      range.open,
      range.close,
      durationMinutes,
      bufferMinutes
    );
    allSlots.push(...slots);
  }
  return [...new Set(allSlots)].sort();
}

/**
 * Filtra slots según capacidad de áreas y reservas existentes.
 */
function filterByCapacityAndReservations(
  slots,
  config,
  dateStr,
  guests,
  existingReservations
) {
  const duration = config.rules.durationMinutes;
  const enabledAreas = config.areas.filter((a) => a.enabled);
  const validAreas = enabledAreas.filter(
    (a) =>
      guests >= a.minPartySize &&
      guests <= a.maxPartySize &&
      a.capacityPeople >= guests
  );
  if (validAreas.length === 0) return [];

  // Reservas confirmadas/completadas ese día para este restaurante
  const dayReservations = existingReservations.filter(
    (r) =>
      r.restaurantId === config.restaurantId &&
      r.date === dateStr &&
      (r.status === "CONFIRMED" || r.status === "PENDING_CONFIRMATION" || r.status === "COMPLETED")
  );

  const buffer = config.rules?.bufferMinutes ?? 0;
  const blockEndOffset = duration + buffer; // cada reserva bloquea duration + buffer

  return slots.filter((slot) => {
    const slotStart = toMinutes(slot);
    const slotEnd = slotStart + duration;
    const overlaps = dayReservations.some((res) => {
      const resStart = toMinutes(res.time);
      const resBlockEnd = resStart + blockEndOffset;
      return slotStart < resBlockEnd && slotEnd > resStart;
    });
    return !overlaps;
  });
}

/**
 * Obtiene slots disponibles para una fecha y número de personas.
 * @param {Object} config - Configuración del restaurante (reservationConfig)
 * @param {string} dateStr - "2026-02-20"
 * @param {number} guests - 2
 * @param {Array} existingReservations - reservas existentes
 * @returns {string[]} Slots disponibles ["12:00", "12:30", ...]
 */
export function getAvailableSlots(config, dateStr, guests, existingReservations = []) {
  if (!config || !config.reservationsEnabled || config.reservationsPaused) {
    return [];
  }
  if (!config.wizardCompleted) return [];

  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const duration = config.rules?.durationMinutes ?? 90;
  const buffer = config.rules?.bufferMinutes ?? 0;

  const potential = getPotentialSlotsForDay(
    config.openingHours,
    dayOfWeek,
    duration,
    buffer
  );

  return filterByCapacityAndReservations(
    potential,
    config,
    dateStr,
    guests,
    existingReservations
  );
}

/**
 * Obtiene la hora mínima disponible para hoy según antelación.
 * @returns {string|null} "14:00" o null si no es hoy
 */
export function getMinAvailableTimeToday(minAdvanceHours = 1) {
  const now = new Date();
  const minTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const h = minTime.getHours();
  const m = minTime.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Valida antelación mínima. No se pueden reservar slots que empiecen
 * antes de (now + minAdvanceHours).
 */
export function filterByMinAdvance(slots, dateStr, minAdvanceHours = 1) {
  const now = new Date();
  const minTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const isToday = dateStr === now.toISOString().split("T")[0];

  if (!isToday) return slots;

  const minMins = minTime.getHours() * 60 + minTime.getMinutes();
  return slots.filter((slot) => toMinutes(slot) >= minMins);
}
