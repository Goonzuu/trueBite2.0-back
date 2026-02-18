/**
 * Capa de datos: hidrata el store desde la API cuando USE_API=true.
 * El store usa esta hidratación y mutaciones que llaman a la API.
 */
import { api, USE_API } from "./api";

export { USE_API };

/**
 * Hidrata el store con datos de la API (restaurantes, reservas, reviews, beneficios).
 * Llamar en mount del cliente cuando USE_API=true.
 * @param {Object} store - { getState, setState } de useAppStore
 * @param {string} [userId] - opcional; si no se pasa, reservas no se filtran por usuario
 */
export async function hydrateStoreFromApi(store, userId) {
  if (!USE_API || !store?.getState || !store?.setState) return;

  const set = store.setState;
  const get = store.getState;

  try {
    const [restaurantsRes, reservationsRes, reviewsRes, benefitsRes] =
      await Promise.all([
        api.restaurants.list().catch(() => ({ success: false, data: [] })),
        api.reservations
          .list(userId ? { userId } : {})
          .catch(() => ({ success: false, data: [] })),
        api.reviews.list().catch(() => ({ success: false, data: [] })),
        api.userBenefits.list().catch(() => ({ success: false, data: [] })),
      ]);

    set((state) => ({
      restaurants: restaurantsRes.success ? restaurantsRes.data : state.restaurants,
      reservations: reservationsRes.success
        ? reservationsRes.data
        : state.reservations,
      reviews: reviewsRes.success ? reviewsRes.data : state.reviews,
      userBenefits: benefitsRes.success ? benefitsRes.data : state.userBenefits,
    }));
  } catch (err) {
    console.warn("[data-layer] hydrate failed:", err);
  }
}

/**
 * Carga la config de reservas de un restaurante desde la API y la guarda en el store.
 * Llamar cuando se necesite config y USE_API=true (p. ej. en página de reservar o panel).
 */
export async function loadRestaurantConfigFromApi(store, restaurantId) {
  if (!USE_API || !store?.getState || !store?.setState) return;

  try {
    const res = await api.restaurantConfig.get(restaurantId);
    if (res.success && res.data) {
      store.setState((state) => ({
        restaurantConfigs: {
          ...state.restaurantConfigs,
          [restaurantId]: res.data,
        },
      }));
    }
  } catch (err) {
    console.warn("[data-layer] loadRestaurantConfig failed:", err);
  }
}
