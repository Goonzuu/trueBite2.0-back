/**
 * Constantes centralizadas para TrueBite.
 * Facilita cambios y preparación para backend.
 */

export const STORAGE_KEYS = {
  FAVORITES: "truebite_favorites",
  COMENSAL: "truebite_comensal",
  RESTAURANTE: "truebite_restaurante",
  RESTAURANT_CONFIGS: "truebite_restaurant_configs",
  ADMIN_LEGACY: "truebite_admin",
};

export const RESERVATION_STATUS = {
  PENDING_CONFIRMATION: "PENDING_CONFIRMATION",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
  CANCELED: "CANCELED",
};

export const CONFIRMATION_MODE = {
  AUTO: "auto",
  MANUAL: "manual",
};

/** Mínimo de píxeles para áreas táctiles (accesibilidad móvil) */
export const MIN_TOUCH_TARGET = 44;
