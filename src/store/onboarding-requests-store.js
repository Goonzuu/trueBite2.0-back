/**
 * Store de solicitudes "Soy Restaurante".
 * Con Supabase: escribe en restaurant_onboarding_requests.
 * Sin Supabase: en memoria (solo para desarrollo).
 */
const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");

const memoryRequests = [];

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    restaurant_name: row.restaurant_name ?? "",
    email: row.email ?? "",
    whatsapp: row.whatsapp ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    instagram: row.instagram ?? null,
    accepts_reservations: row.accepts_reservations ?? null,
    reservations_volume_estimate: row.reservations_volume_estimate ?? null,
    status: row.status ?? "PENDING",
    notes: row.notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  };
}

async function addRequest(data) {
  const row = {
    restaurant_name: data.restaurant_name?.trim() || "",
    email: data.email?.trim() || "",
    whatsapp: data.whatsapp?.trim() || null,
    address: data.address?.trim() || null,
    city: data.city?.trim() || null,
    instagram: data.instagram?.trim() || null,
    accepts_reservations: data.accepts_reservations ?? null,
    reservations_volume_estimate: data.reservations_volume_estimate != null ? String(data.reservations_volume_estimate).trim() || null : null,
    status: "PENDING",
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data: inserted, error } = await supabase
      .from("restaurant_onboarding_requests")
      .insert(row)
      .select("id, created_at, status")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id, created_at: inserted.created_at, status: inserted.status ?? "PENDING", ...row };
  }

  const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  memoryRequests.push({ id, ...row, updated_at: row.created_at });
  return { id, status: "PENDING", ...row, created_at: row.created_at, updated_at: row.created_at };
}

const STATUSES = ["PENDING", "CONTACTED", "APPROVED", "REJECTED"];

/**
 * Lista solicitudes con filtros y paginación.
 * @param {Object} opts - { status?, q?, limit (default 30), offset (default 0), sort (default created_at), order (default desc) }
 * @returns {{ data: Array, total: number }}
 */
async function list(opts = {}) {
  const limit = Math.min(Math.max(1, parseInt(opts.limit, 10) || 30), 100);
  const offset = Math.max(0, parseInt(opts.offset, 10) || 0);
  const sort = opts.sort === "created_at" ? "created_at" : "created_at";
  const order = opts.order === "asc" ? "asc" : "desc";
  const status = opts.status != null && STATUSES.includes(opts.status) ? opts.status : null;
  const q = typeof opts.q === "string" ? opts.q.trim() : null;

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    let query = supabase
      .from("restaurant_onboarding_requests")
      .select("*", { count: "exact" });
    if (status) query = query.eq("status", status);
    if (q && q.length > 0) {
      query = query.or(`restaurant_name.ilike.%${q}%,email.ilike.%${q}%`);
    }
    query = query.order(sort, { ascending: order === "asc" });
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return { data: (data || []).map(mapRow), total: count ?? (data || []).length };
  }

  let list = [...memoryRequests];
  if (status) list = list.filter((r) => r.status === status);
  if (q && q.length > 0) {
    const lower = q.toLowerCase();
    list = list.filter(
      (r) =>
        (r.restaurant_name && r.restaurant_name.toLowerCase().includes(lower)) ||
        (r.email && r.email.toLowerCase().includes(lower))
    );
  }
  list.sort((a, b) => {
    const tA = new Date(a.created_at || 0).getTime();
    const tB = new Date(b.created_at || 0).getTime();
    return order === "asc" ? tA - tB : tB - tA;
  });
  const total = list.length;
  list = list.slice(offset, offset + limit);
  return { data: list.map(mapRow), total };
}

/**
 * Actualiza una solicitud por id (status y/o notes).
 * @returns {Object|null} fila actualizada o null si no existe
 */
async function updateById(id, patch) {
  const updates = {};
  if (patch.status !== undefined) {
    if (!STATUSES.includes(patch.status)) throw new Error("Status inválido");
    updates.status = patch.status;
  }
  if (patch.notes !== undefined) updates.notes = typeof patch.notes === "string" ? patch.notes : null;

  if (Object.keys(updates).length === 0) {
    return getById(id);
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("restaurant_onboarding_requests")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data ? mapRow(data) : null;
  }

  const idx = memoryRequests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  memoryRequests[idx] = { ...memoryRequests[idx], ...updates, updated_at: new Date().toISOString() };
  return mapRow(memoryRequests[idx]);
}

async function getById(id) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("restaurant_onboarding_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRow(data) : null;
  }
  const r = memoryRequests.find((x) => x.id === id);
  return r ? mapRow(r) : null;
}

module.exports = { addRequest, list, updateById, getById, STATUSES };
