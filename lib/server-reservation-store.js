/**
 * Store en memoria de reservas.
 * Inicializado con mock-data; POST añade aquí. Usado hasta tener persistencia (Supabase).
 */
import { reservations as initialReservations } from "./mock-data";

let list = [...initialReservations];

export function getReservations() {
  return [...list];
}

export function getReservationById(id) {
  return list.find((r) => r.id === id) ?? null;
}

export function getReservationsForRestaurantAndDate(restaurantId, date) {
  return list.filter(
    (r) =>
      r.restaurantId === restaurantId &&
      r.date === date &&
      ["CONFIRMED", "PENDING_CONFIRMATION", "COMPLETED"].includes(r.status)
  );
}

export function addReservation(reservation) {
  const withId = { ...reservation, id: reservation.id || `res-${Date.now()}` };
  list = [withId, ...list];
  return withId;
}

export function updateReservation(id, patch) {
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  return list[idx];
}
