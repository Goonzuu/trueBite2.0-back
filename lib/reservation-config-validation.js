/**
 * Validaciones para configuración de reservas (wizard, disponibilidad).
 */

function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** open < close en cada rango */
export function validateTimeRange(range) {
  const open = toMinutes(range.open);
  const close = toMinutes(range.close);
  if (open >= close) return { valid: false, message: "La hora de cierre debe ser posterior a la de apertura" };
  return { valid: true };
}

/** Rangos del mismo día sin solaparse */
export function validateRangesNoOverlap(ranges) {
  for (let i = 0; i < ranges.length; i++) {
    const { valid } = validateTimeRange(ranges[i]);
    if (!valid) return { valid: false, message: "Revisa los horarios del día" };
  }
  for (let i = 0; i < ranges.length; i++) {
    const aStart = toMinutes(ranges[i].open);
    const aEnd = toMinutes(ranges[i].close);
    for (let j = i + 1; j < ranges.length; j++) {
      const bStart = toMinutes(ranges[j].open);
      const bEnd = toMinutes(ranges[j].close);
      if (aStart < bEnd && aEnd > bStart) {
        return { valid: false, message: "Los rangos horarios no pueden solaparse" };
      }
    }
  }
  return { valid: true };
}

/** Al menos 1 día abierto */
export function validateAtLeastOneDayOpen(openingHours) {
  const hasOpen = Object.values(openingHours || {}).some((r) => r?.length > 0);
  if (!hasOpen) return { valid: false, message: "Debes tener al menos un día abierto" };
  return { valid: true };
}

/** Validar todos los días */
export function validateOpeningHours(openingHours) {
  const oneDay = validateAtLeastOneDayOpen(openingHours);
  if (!oneDay.valid) return oneDay;
  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    const ranges = openingHours[day] || [];
    for (const r of ranges) {
      const tr = validateTimeRange(r);
      if (!tr.valid) return tr;
    }
    const overlap = validateRangesNoOverlap(ranges);
    if (!overlap.valid) return overlap;
  }
  return { valid: true };
}

/** capacity > 0, maxPartySize >= minPartySize */
export function validateArea(area) {
  if (!area.enabled) return { valid: true };
  if ((area.capacityPeople || 0) <= 0) {
    return { valid: false, message: `Área "${area.name}": la capacidad debe ser mayor que 0` };
  }
  const min = area.minPartySize ?? 1;
  const max = area.maxPartySize ?? 8;
  if (max < min) {
    return { valid: false, message: `Área "${area.name}": el máximo de personas debe ser ≥ al mínimo` };
  }
  return { valid: true };
}

/** Máximo global coherente con áreas */
export function validateMaxCoherentWithAreas(areas, maxPeoplePerReservation) {
  const maxArea = Math.max(...(areas.filter((a) => a.enabled).map((a) => a.maxPartySize || 0)), 0);
  if (maxArea > 0 && (maxPeoplePerReservation || 0) < maxArea) {
    return {
      valid: false,
      message: `El máximo global (${maxPeoplePerReservation}) debe ser al menos ${maxArea} (máximo de tus áreas)`,
    };
  }
  return { valid: true };
}

/** Validar todas las áreas */
export function validateAreas(areas) {
  const enabled = areas?.filter((a) => a.enabled) || [];
  if (enabled.length === 0) {
    return { valid: false, message: "Necesitas al menos un área habilitada" };
  }
  for (const a of enabled) {
    const v = validateArea(a);
    if (!v.valid) return v;
  }
  return { valid: true };
}
