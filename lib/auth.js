/**
 * Demo auth helpers - separación clara de roles.
 * No es autenticación de producción.
 */

const COMENSAL_KEY = "truebite_comensal";
const RESTAURANTE_KEY = "truebite_restaurante";

export function isComensalLoggedIn() {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem(COMENSAL_KEY);
    return !!data && JSON.parse(data).loggedIn === true;
  } catch {
    return false;
  }
}

export function isRestauranteLoggedIn() {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem(RESTAURANTE_KEY);
    return !!data && JSON.parse(data).loggedIn === true;
  } catch {
    return false;
  }
}

export function loginComensal(email = "demo@truebite.com") {
  localStorage.setItem(
    COMENSAL_KEY,
    JSON.stringify({ email, loggedIn: true, timestamp: Date.now() })
  );
}

export function loginRestaurante(email = "restaurante@truebite.com") {
  localStorage.setItem(
    RESTAURANTE_KEY,
    JSON.stringify({ email, loggedIn: true, timestamp: Date.now() })
  );
}

export function logoutComensal() {
  localStorage.removeItem(COMENSAL_KEY);
}

export function logoutRestaurante() {
  localStorage.removeItem(RESTAURANTE_KEY);
}
