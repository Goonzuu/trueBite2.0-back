/**
 * Store en memoria de configuración de reservas por restaurante.
 * Usado por las rutas API hasta tener persistencia (Supabase).
 */
import { createDefaultConfig } from "./reservation-config";

const configs = new Map();

export function getConfig(restaurantId) {
  if (!configs.has(restaurantId)) {
    configs.set(restaurantId, createDefaultConfig(restaurantId));
  }
  return configs.get(restaurantId);
}

export function setConfig(restaurantId, config) {
  const next = { ...config, restaurantId };
  configs.set(restaurantId, next);
  return next;
}
