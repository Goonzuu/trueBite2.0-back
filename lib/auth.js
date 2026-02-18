/**
 * Demo auth helpers - separación clara de roles.
 * No es autenticación de producción.
 */

import { STORAGE_KEYS } from "./constants";

export function isComensalLoggedIn() {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMENSAL);
    return !!data && JSON.parse(data).loggedIn === true;
  } catch {
    return false;
  }
}

export function isRestauranteLoggedIn() {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESTAURANTE);
    return !!data && JSON.parse(data).loggedIn === true;
  } catch {
    return false;
  }
}

export function loginComensal(email = "demo@truebite.com") {
  localStorage.setItem(
    STORAGE_KEYS.COMENSAL,
    JSON.stringify({ email, loggedIn: true, timestamp: Date.now() })
  );
}

export function loginRestaurante(email = "restaurante@truebite.com", restaurantId = null) {
  localStorage.setItem(
    STORAGE_KEYS.RESTAURANTE,
    JSON.stringify({
      email,
      restaurantId: restaurantId || null,
      loggedIn: true,
      timestamp: Date.now(),
    })
  );
}

/** Devuelve el ID del restaurante que gestiona el restaurante logueado. */
export function getRestauranteRestaurantId() {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESTAURANTE);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed.loggedIn === true ? parsed.restaurantId || null : null;
  } catch {
    return null;
  }
}

export function logoutComensal() {
  localStorage.removeItem(STORAGE_KEYS.COMENSAL);
}

export function logoutRestaurante() {
  localStorage.removeItem(STORAGE_KEYS.RESTAURANTE);
}
