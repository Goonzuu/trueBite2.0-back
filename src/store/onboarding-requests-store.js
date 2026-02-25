/**
 * Store de solicitudes "Soy Restaurante".
 * Con Supabase: escribe en restaurant_onboarding_requests.
 * Sin Supabase: en memoria (solo para desarrollo).
 */
const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");

const memoryRequests = [];

async function addRequest(data) {
  const row = {
    restaurant_name: data.restaurant_name?.trim() || "",
    email: data.email?.trim() || "",
    whatsapp: data.whatsapp?.trim() || null,
    address: data.address?.trim() || null,
    city: data.city?.trim() || null,
    instagram: data.instagram?.trim() || null,
    accepts_reservations: data.accepts_reservations ?? null,
    reservations_volume_estimate: data.reservations_volume_estimate?.trim() || null,
    status: "PENDING",
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data: inserted, error } = await supabase
      .from("restaurant_onboarding_requests")
      .insert(row)
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id, created_at: inserted.created_at, ...row };
  }

  const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  memoryRequests.push({ id, ...row });
  return { id, ...row };
}

module.exports = { addRequest };
