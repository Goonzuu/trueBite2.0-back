/**
 * Store de reservas: Supabase cuando está configurado, mock en memoria si no.
 */
const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");
const { reservations: initialReservations } = require("../data/mock");

let memoryList = [...initialReservations];

function mapRowToReservation(row) {
  if (!row) return null;
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    userId: row.user_id || undefined,
    date: row.date,
    time: row.time,
    guests: row.guests,
    status: row.status,
    notes: row.notes || "",
    reviewed: row.reviewed === true,
    appliedBenefitId: row.applied_benefit_id || undefined,
  };
}

async function getReservations() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("reservations").select("*").order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapRowToReservation);
  }
  return [...memoryList];
}

async function getReservationById(id) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("reservations").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return mapRowToReservation(data);
  }
  return memoryList.find((r) => r.id === id) ?? null;
}

async function getReservationsForRestaurantAndDate(restaurantId, date) {
  const all = await getReservations();
  return all.filter(
    (r) =>
      r.restaurantId === restaurantId &&
      r.date === date &&
      ["CONFIRMED", "PENDING_CONFIRMATION", "COMPLETED"].includes(r.status)
  );
}

async function addReservation(reservation) {
  const payload = {
    restaurant_id: reservation.restaurantId,
    user_id: reservation.userId || null,
    date: reservation.date,
    time: reservation.time,
    guests: reservation.guests,
    status: reservation.status,
    notes: reservation.notes ?? "",
    reviewed: reservation.reviewed === true,
    applied_benefit_id: reservation.appliedBenefitId || null,
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("reservations").insert(payload).select("*").single();
    if (error) {
      if (error.code === "23505") {
        const err = new Error("El horario seleccionado ya no está disponible. Elige otro slot.");
        err.code = "SLOT_UNAVAILABLE";
        throw err;
      }
      throw new Error(error.message);
    }
    return mapRowToReservation(data);
  }

  const withId = { ...reservation, id: reservation.id || `res-${Date.now()}` };
  memoryList = [withId, ...memoryList];
  return withId;
}

async function updateReservation(id, patch) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const updatePayload = {};
    if (patch.status !== undefined) updatePayload.status = patch.status;
    if (patch.reviewEnabled !== undefined) updatePayload.reviewed = patch.reviewEnabled;
    if (patch.notes !== undefined) updatePayload.notes = patch.notes;
    const { data, error } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRowToReservation(data);
  }

  const idx = memoryList.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  memoryList[idx] = { ...memoryList[idx], ...patch };
  return memoryList[idx];
}

module.exports = {
  getReservations,
  getReservationById,
  getReservationsForRestaurantAndDate,
  addReservation,
  updateReservation,
};
