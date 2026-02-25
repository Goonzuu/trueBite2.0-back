/**
 * Store de beneficios por usuario: Supabase cuando está configurado, memoria si no.
 */
const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");

const memoryList = [];

function mapRowToBenefit(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    description: row.description,
    used: row.used === true,
    expiresAt: row.expires_at || undefined,
    reservationIdEarned: row.reservation_id_earned || undefined,
  };
}

async function listByUser(userId) {
  if (!userId) return [];
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_benefits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapRowToBenefit);
  }
  return memoryList.filter((b) => b.userId === userId);
}

async function getById(id) {
  if (!id) return null;
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("user_benefits").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return mapRowToBenefit(data);
  }
  const b = memoryList.find((x) => x.id === id) ?? null;
  return b;
}

async function markUsed(id) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("user_benefits").update({ used: true }).eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }
  const idx = memoryList.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  memoryList[idx] = { ...memoryList[idx], used: true };
  return true;
}

async function add(benefit) {
  const payload = {
    user_id: benefit.userId,
    restaurant_id: benefit.restaurantId,
    description: benefit.description,
    used: benefit.used === true,
    expires_at: benefit.expiresAt || null,
    reservation_id_earned: benefit.reservationIdEarned || null,
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("user_benefits").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return mapRowToBenefit(data);
  }

  const newBenefit = {
    id: `ub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ...benefit,
    used: false,
  };
  memoryList.push(newBenefit);
  return newBenefit;
}

module.exports = { listByUser, getById, markUsed, add, mapRowToBenefit };
