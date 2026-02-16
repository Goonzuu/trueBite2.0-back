"use client";

import { useAppStore } from "@/lib/store";
import { RestaurantCard } from "@/components/truebite/restaurant-card";
import { SearchBar } from "@/components/truebite/search-bar";
import { TagPill } from "@/components/truebite/tag-pill";
import { cuisineFilters } from "@/lib/mock-data";
import { SearchX, UtensilsCrossed } from "lucide-react";

export default function ExplorePage() {
  const {
    searchQuery,
    selectedCuisine,
    setSelectedCuisine,
    setSearchQuery,
    getFilteredRestaurants,
  } = useAppStore();

  const filtered = getFilteredRestaurants();
  const hasActiveFilters = searchQuery.trim() !== "" || selectedCuisine !== "Todos";

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-serif text-balance">
          Descubre tu proxima experiencia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo reviews de comensales verificados
        </p>
      </div>

      <SearchBar />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {cuisineFilters.map((cuisine) => (
          <TagPill
            key={cuisine}
            active={selectedCuisine === cuisine}
            onClick={() => setSelectedCuisine(cuisine)}
          >
            {cuisine}
          </TagPill>
        ))}
      </div>

      <section aria-label="Lista de restaurantes">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <SearchX className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-foreground">
                No encontramos resultados
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Prueba buscando por nombre, tipo de cocina o barrio. Tambien puedes cambiar la categoria.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCuisine("Todos");
                }}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "restaurante" : "restaurantes"}
                {selectedCuisine !== "Todos" && ` en ${selectedCuisine}`}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
