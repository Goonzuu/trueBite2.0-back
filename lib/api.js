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
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
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
  reservations: {
    list: () => fetchApi("/reservations"),
    create: (body) => fetchApi("/reservations", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => fetchApi(`/reservations/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },
  reviews: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return fetchApi(`/reviews${q ? `?${q}` : ""}`);
    },
    create: (body) => fetchApi("/reviews", { method: "POST", body: JSON.stringify(body) }),
  },
};

/**
 * Flag para usar API real vs store local.
 * Cuando el backend esté listo: NEXT_PUBLIC_USE_API=true
 */
export const USE_API = process.env.NEXT_PUBLIC_USE_API === "true";
