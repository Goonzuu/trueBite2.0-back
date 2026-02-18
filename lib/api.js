/**
 * Capa de API para TrueBite.
 * Preparada para conectar a backend real.
 * Mientras tanto, las rutas Next.js /api/* sirven los datos.
 *
 * Para backend externo: NEXT_PUBLIC_API_URL=https://api.truebite.com
 */

async function fetchApi(path, options = {}) {
  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window === "undefined" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "");
  const url = base ? `${base}/api${path}` : `/api${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `API error ${res.status}`);
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Restaurantes */
export const api = {
  restaurants: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return fetchApi(`/restaurants${q ? `?${q}` : ""}`);
    },
    get: (id) => fetchApi(`/restaurants/${id}`),
  },

  /** Configuración de reservas por restaurante */
  restaurantConfig: {
    get: (restaurantId) => fetchApi(`/restaurants/${restaurantId}/config`),
    set: (restaurantId, body) =>
      fetchApi(`/restaurants/${restaurantId}/config`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },

  /** Slots disponibles para fecha y comensales */
  availability: (restaurantId, date, guests) => {
    const q = new URLSearchParams({ date, guests: String(guests) }).toString();
    return fetchApi(`/restaurants/${restaurantId}/availability?${q}`);
  },

  reservations: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return fetchApi(`/reservations${q ? `?${q}` : ""}`);
    },
    get: (id) => fetchApi(`/reservations/${id}`),
    create: (body) =>
      fetchApi("/reservations", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      fetchApi(`/reservations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },

  reviews: {
    list: (params = {}) => {
      const q = new URLSearchParams(params || {}).toString();
      return fetchApi(`/reviews${q ? `?${q}` : ""}`);
    },
    create: (body) =>
      fetchApi("/reviews", { method: "POST", body: JSON.stringify(body) }),
  },

  /** Beneficios de fidelización del usuario (requiere auth en backend) */
  userBenefits: {
    list: () => fetchApi("/users/me/benefits"),
  },
};

/**
 * Flag para usar API real vs store local.
 * Cuando el backend esté listo: NEXT_PUBLIC_USE_API=true
 */
export const USE_API = process.env.NEXT_PUBLIC_USE_API === "true";
