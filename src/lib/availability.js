function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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

function getPotentialSlotsForDay(openingHours, dayOfWeek, durationMinutes, bufferMinutes = 0) {
  const ranges = openingHours[dayOfWeek] || [];
  const allSlots = [];
  for (const range of ranges) {
    allSlots.push(
      ...generateSlotsInRange(range.open, range.close, durationMinutes, bufferMinutes)
    );
  }
  return [...new Set(allSlots)].sort();
}

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

  const dayReservations = existingReservations.filter(
    (r) =>
      r.restaurantId === config.restaurantId &&
      r.date === dateStr &&
      ["CONFIRMED", "PENDING_CONFIRMATION", "COMPLETED"].includes(r.status)
  );

  const buffer = config.rules?.bufferMinutes ?? 0;
  const blockEndOffset = duration + buffer;

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

function getAvailableSlots(config, dateStr, guests, existingReservations = []) {
  if (!config || !config.reservationsEnabled || config.reservationsPaused) return [];
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

function filterByMinAdvance(slots, dateStr, minAdvanceHours = 1) {
  const now = new Date();
  const minTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const isToday = dateStr === now.toISOString().split("T")[0];
  if (!isToday) return slots;
  const minMins = minTime.getHours() * 60 + minTime.getMinutes();
  return slots.filter((slot) => toMinutes(slot) >= minMins);
}

module.exports = { getAvailableSlots, filterByMinAdvance };