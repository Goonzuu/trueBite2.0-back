/**
 * Store de configuración de reservas por restaurante: Supabase cuando está configurado, memoria si no.
 */
const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");
const { createDefaultConfig } = require("../lib/reservation-config");

const memoryConfigs = new Map();

async function getConfig(restaurantId) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reservation_configs")
      .select("config")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data && data.config) {
      return { ...data.config, restaurantId };
    }
    return createDefaultConfig(restaurantId);
  }
  if (!memoryConfigs.has(restaurantId)) {
    memoryConfigs.set(restaurantId, createDefaultConfig(restaurantId));
  }
  return memoryConfigs.get(restaurantId);
}

async function setConfig(restaurantId, config) {
  const next = { ...config, restaurantId };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const payload = {
      restaurant_id: restaurantId,
      config: next,
    };
    const { error } = await supabase
      .from("reservation_configs")
      .upsert(payload, { onConflict: "restaurant_id" });
    if (error) throw new Error(error.message);
    return next;
  }

  memoryConfigs.set(restaurantId, next);
  return next;
}

module.exports = { getConfig, setConfig };
