const { reservations: initialReservations } = require("../data/mock");

let list = [...initialReservations];

function getReservations() {
  return [...list];
}

function getReservationById(id) {
  return list.find((r) => r.id === id) ?? null;
}

function getReservationsForRestaurantAndDate(restaurantId, date) {
  return list.filter(
    (r) =>
      r.restaurantId === restaurantId &&
      r.date === date &&
      ["CONFIRMED", "PENDING_CONFIRMATION", "COMPLETED"].includes(r.status)
  );
}

function addReservation(reservation) {
  const withId = { ...reservation, id: reservation.id || `res-${Date.now()}` };
  list = [withId, ...list];
  return withId;
}

function updateReservation(id, patch) {
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  return list[idx];
}

module.exports = {
  getReservations,
  getReservationById,
  getReservationsForRestaurantAndDate,
  addReservation,
  updateReservation,
};