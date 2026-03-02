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

/**
 * Lista reservas con filtros y paginación (para panel restaurante).
 * @param {Object} filters - { restaurantId, status?, dateFrom?, dateTo?, limit?, offset? }
 * @returns {{ data: Array, total: number }}
 */
async function getReservationsFiltered(filters) {
  const { restaurantId, status, dateFrom, dateTo, limit: limitParam, offset: offsetParam } = filters || {};
  const limit = Math.min(parseInt(limitParam, 10) || 500, 500);
  const offset = Math.max(0, parseInt(offsetParam, 10) || 0);

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    let q = supabase
      .from("reservations")
      .select("*", { count: "exact" })
      .eq("restaurant_id", restaurantId);
    if (status) q = q.eq("status", status);
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    q = q.order("date", { ascending: true }).order("time");
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []).map(mapRowToReservation), total: count ?? (data || []).length };
  }

  let list = memoryList.filter((r) => r.restaurantId === restaurantId);
  if (status) list = list.filter((r) => r.status === status);
  if (dateFrom) list = list.filter((r) => r.date >= dateFrom);
  if (dateTo) list = list.filter((r) => r.date <= dateTo);
  list.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : (a.time || "").localeCompare(b.time || "");
  });
  const total = list.length;
  list = list.slice(offset, offset + limit);
  return { data: list, total };
}

/**
 * Lista reservas con filtros (admin). restaurantId opcional (si no se pasa, todas).
 * @param {Object} filters - { restaurantId?, status?, dateFrom?, dateTo?, limit?, offset? }
 * @returns {{ data: Array, total: number }}
 */
async function getReservationsFilteredAdmin(filters) {
  const { restaurantId, status, dateFrom, dateTo, limit: limitParam, offset: offsetParam } = filters || {};
  const limit = Math.min(parseInt(limitParam, 10) || 100, 500);
  const offset = Math.max(0, parseInt(offsetParam, 10) || 0);

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    let q = supabase.from("reservations").select("*", { count: "exact" });
    if (restaurantId) q = q.eq("restaurant_id", restaurantId);
    if (status) q = q.eq("status", status);
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    q = q.order("date", { ascending: false }).order("time");
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []).map(mapRowToReservation), total: count ?? (data || []).length };
  }

  let list = [...memoryList];
  if (restaurantId) list = list.filter((r) => r.restaurantId === restaurantId);
  if (status) list = list.filter((r) => r.status === status);
  if (dateFrom) list = list.filter((r) => r.date >= dateFrom);
  if (dateTo) list = list.filter((r) => r.date <= dateTo);
  list.sort((a, b) => {
    const d = (b.date || "").localeCompare(a.date || "");
    return d !== 0 ? d : (a.time || "").localeCompare(b.time || "");
  });
  const total = list.length;
  list = list.slice(offset, offset + limit);
  return { data: list, total };
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
  getReservationsFiltered,
  getReservationsFilteredAdmin,
  getReservationById,
  getReservationsForRestaurantAndDate,
  addReservation,
  updateReservation,
};
