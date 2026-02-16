import { create } from "zustand";
import { restaurants, reservations, reviews, currentUser } from "./mock-data";

// Helper para cargar favoritos desde localStorage
const loadFavoritesFromStorage = () => {
  if (typeof window === "undefined") return currentUser.favoriteRestaurants;
  try {
    const stored = localStorage.getItem("truebite_favorites");
    return stored ? JSON.parse(stored) : currentUser.favoriteRestaurants;
  } catch {
    return currentUser.favoriteRestaurants;
  }
};

// Helper para guardar favoritos en localStorage
const saveFavoritesToStorage = (favorites) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("truebite_favorites", JSON.stringify(favorites));
  } catch (error) {
    console.warn("No se pudieron guardar favoritos en localStorage:", error);
  }
};

// userBenefits: beneficios del usuario (otorgados automáticamente al dejar review)
// Se consumen al hacer nueva reserva en ese restaurante
const initialUserBenefits = [];

export const useAppStore = create((set, get) => ({
  restaurants,
  reservations,
  reviews,
  userBenefits: initialUserBenefits,
  user: {
    ...currentUser,
    favoriteRestaurants: loadFavoritesFromStorage(),
  },
  searchQuery: "",
  selectedCuisine: "Todos",

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCuisine: (cuisine) => set({ selectedCuisine: cuisine }),

  getRestaurantById: (id) => {
    return get().restaurants.find((r) => r.id === id) || null;
  },

  getReservationById: (id) => {
    return get().reservations.find((r) => r.id === id) || null;
  },

  getReviewsForRestaurant: (restaurantId) => {
    return get().reviews.filter((r) => r.restaurantId === restaurantId);
  },

  /**
   * Returns unused, non-expired user benefits for a restaurant.
   * Benefits expire 30 days after being granted.
   */
  getActiveBenefitsForRestaurant: (restaurantId) => {
    const now = new Date();
    return get().userBenefits.filter(
      (ub) =>
        ub.restaurantId === restaurantId &&
        !ub.used &&
        (!ub.expiresAt || new Date(ub.expiresAt) > now)
    );
  },

  /** Returns all active (unused, non-expired) benefits for the current user. */
  getActiveUserBenefits: () => {
    const now = new Date();
    return get().userBenefits.filter(
      (ub) => !ub.used && (!ub.expiresAt || new Date(ub.expiresAt) > now)
    );
  },

  /** Admin: configurar beneficio opcional por restaurante. */
  updateRestaurantBenefit: (restaurantId, benefit) =>
    set((state) => ({
      restaurants: state.restaurants.map((r) =>
        r.id === restaurantId
          ? { ...r, benefit: benefit.trim() || undefined }
          : r
      ),
    })),

  getFilteredRestaurants: () => {
    const { restaurants, searchQuery, selectedCuisine } = get();
    const q = searchQuery.toLowerCase().trim();
    return restaurants.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.cuisineCategory.toLowerCase().includes(q) ||
        r.neighborhood.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCuisine =
        selectedCuisine === "Todos" || r.cuisineCategory === selectedCuisine;
      return matchesSearch && matchesCuisine;
    });
  },

  addReservation: (reservation) =>
    set((state) => {
      const newRes = {
        ...reservation,
        id: `res-${Date.now()}`,
        status: "PENDING_CONFIRMATION",
        reviewed: false,
      };

      // Si aplicó un beneficio, marcarlo como usado
      const updatedUserBenefits = reservation.appliedBenefitId
        ? state.userBenefits.map((ub) =>
            ub.id === reservation.appliedBenefitId ? { ...ub, used: true } : ub
          )
        : state.userBenefits;

      const { appliedBenefitId, ...cleanRes } = newRes;

      return {
        reservations: [{ ...cleanRes }, ...state.reservations],
        userBenefits: updatedUserBenefits,
      };
    }),

  cancelReservation: (reservationId) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: "CANCELED" } : r
      ),
    })),

  confirmReservation: (reservationId) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: "CONFIRMED" } : r
      ),
    })),

  markReservationCompleted: (reservationId) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId
          ? { ...r, status: "COMPLETED", reviewEnabled: true }
          : r
      ),
    })),

  markReservationNoShow: (reservationId) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: "NO_SHOW" } : r
      ),
    })),

  addReview: (review) =>
    set((state) => {
      const newReview = {
        ...review,
        id: `rev-${Date.now()}`,
        verified: true,
        status: "VERIFIED",
        date: new Date().toISOString().split("T")[0],
      };

      const updatedReviews = [newReview, ...state.reviews];

      // Recalculate the restaurant's average rating
      const restaurantReviews = updatedReviews.filter(
        (r) => r.restaurantId === review.restaurantId
      );
      const newAvg =
        restaurantReviews.length > 0
          ? Math.round(
              (restaurantReviews.reduce((sum, r) => sum + r.rating, 0) /
                restaurantReviews.length) *
                10
            ) / 10
          : 0;

      const restaurant = state.restaurants.find((r) => r.id === review.restaurantId);
      const benefit = restaurant?.benefit?.trim();

      // Si el restaurante tiene beneficio configurado, otorgarlo automáticamente (válido 30 días)
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const newUserBenefits = benefit
        ? [
            ...state.userBenefits,
            {
              id: `ub-${Date.now()}`,
              restaurantId: review.restaurantId,
              benefit,
              used: false,
              fromReservationId: review.reservationId,
              createdAt: now.toISOString(),
              expiresAt: expiresAt.toISOString(),
            },
          ]
        : state.userBenefits;

      return {
        reviews: updatedReviews,
        reservations: state.reservations.map((r) =>
          r.id === review.reservationId ? { ...r, reviewed: true } : r
        ),
        restaurants: state.restaurants.map((r) =>
          r.id === review.restaurantId
            ? {
                ...r,
                rating: newAvg,
                reviewCount: restaurantReviews.length,
              }
            : r
        ),
        userBenefits: newUserBenefits,
      };
    }),

  toggleFavorite: (restaurantId) =>
    set((state) => {
      const isFav = state.user.favoriteRestaurants.includes(restaurantId);
      const newFavorites = isFav
        ? state.user.favoriteRestaurants.filter((id) => id !== restaurantId)
        : [...state.user.favoriteRestaurants, restaurantId];
      
      // Persistir en localStorage
      saveFavoritesToStorage(newFavorites);
      
      return {
        user: {
          ...state.user,
          favoriteRestaurants: newFavorites,
        },
      };
    }),
}));
