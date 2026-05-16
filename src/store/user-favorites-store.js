/**
 * Favoritos por usuario: Supabase o memoria si no hay cliente.
 */
const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");
const { getById: getRestaurantById } = require("./restaurant-store");

/** @type {Map<string, Set<string>>} */
const memoryByUser = new Map();

async function listRestaurantIds(userId) {
  if (!userId || String(userId).trim() === "") return [];
  const uid = String(userId).trim();

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_favorites")
      .select("restaurant_id")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => String(row.restaurant_id));
  }

  const set = memoryByUser.get(uid);
  return set ? [...set] : [];
}

/**
 * Reemplaza la lista de favoritos del usuario. Valida que cada restaurant_id exista.
 * @param {string} userId
 * @param {string[]} restaurantIds - UUIDs
 */
async function replaceAll(userId, restaurantIds) {
  if (!userId || String(userId).trim() === "") {
    throw new Error("userId requerido");
  }
  const uid = String(userId).trim();
  const unique = [...new Set((restaurantIds || []).map((id) => String(id).trim()).filter(Boolean))];

  for (const rid of unique) {
    const r = await getRestaurantById(rid);
    if (!r) {
      throw new Error(`Restaurante no encontrado: ${rid}`);
    }
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error: delErr } = await supabase.from("user_favorites").delete().eq("user_id", uid);
    if (delErr) throw new Error(delErr.message);
    if (unique.length > 0) {
      const rows = unique.map((restaurant_id) => ({
        user_id: uid,
        restaurant_id,
      }));
      const { error: insErr } = await supabase.from("user_favorites").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }
    return unique;
  }

  memoryByUser.set(uid, new Set(unique));
  return unique;
}

module.exports = { listRestaurantIds, replaceAll };
