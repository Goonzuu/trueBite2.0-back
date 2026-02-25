/**
 * Store de restaurantes: Supabase cuando está configurado, mock en memoria si no.
 * La API siempre devuelve camelCase; Supabase usa snake_case.
 */

const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");
const { restaurants: mockRestaurants } = require("../data/mock");

function mapRowToRestaurant(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    neighborhood: row.neighborhood,
    cuisineCategory: row.cuisine_category,
    cuisine: row.cuisine,
    tags: row.tags || [],
    rating: row.rating != null ? Number(row.rating) : null,
    reviewCount: row.review_count != null ? row.review_count : 0,
    priceRange: row.price_range,
    verifiedOnly: row.verified_only !== false,
    image: row.image,
    address: row.address,
    description: row.description,
    openHours: row.open_hours,
    phone: row.phone,
    instagram: row.instagram,
    website: row.website,
    cancellationPolicy: row.cancellation_policy,
    verified: row.verified === true,
    reservationsThisMonth: row.reservations_this_month != null ? row.reservations_this_month : 0,
    benefit: row.benefit,
    verification_status: row.verification_status,
    menu: Array.isArray(row.menu) ? row.menu : row.menu || [],
  };
}

/**
 * Lista todos los restaurantes. Filtros opcionales: city, category (cuisine_category).
 */
async function list(filters = {}) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    let q = supabase.from("restaurants").select("*").order("name");
    if (filters.city && filters.city.trim() !== "") {
      q = q.eq("city", filters.city.trim());
    }
    if (filters.category && filters.category.trim() !== "") {
      q = q.eq("cuisine_category", filters.category.trim());
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(mapRowToRestaurant);
  }
  let list_ = [...mockRestaurants];
  if (filters.city) list_ = list_.filter((r) => r.city === filters.city);
  if (filters.category) list_ = list_.filter((r) => r.cuisineCategory === filters.category);
  return list_;
}

/**
 * Obtiene un restaurante por id (string, puede ser uuid o "1" en mock).
 */
async function getById(id) {
  if (!id) return null;
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return mapRowToRestaurant(data);
  }
  const r = mockRestaurants.find((x) => x.id === id) || null;
  return r;
}

module.exports = { list, getById, mapRowToRestaurant };
