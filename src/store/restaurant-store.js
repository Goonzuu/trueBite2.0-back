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
 * Lista todos los restaurantes. Filtros opcionales: city, category (cuisine_category), q (búsqueda por nombre).
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
    if (filters.q && filters.q.trim() !== "") {
      q = q.ilike("name", `%${filters.q.trim()}%`);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(mapRowToRestaurant);
  }
  let list_ = [...mockRestaurants];
  if (filters.city) list_ = list_.filter((r) => r.city === filters.city);
  if (filters.category) list_ = list_.filter((r) => r.cuisineCategory === filters.category);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list_ = list_.filter((r) => r.name && r.name.toLowerCase().includes(q));
  }
  return list_;
}

const VERIFICATION_STATUSES = ["INVITED", "CLAIM_REQUESTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED"];

/**
 * Crea un restaurante (admin). Genera id UUID.
 * @param {Object} data - name, city, address?, phone?, instagram?, verification_status (default VERIFIED)
 * @returns {Object} restaurante creado
 */
async function create(data) {
  if (!data.name || String(data.name).trim() === "") throw new Error("Nombre requerido");
  const verificationStatus = VERIFICATION_STATUSES.includes(data.verification_status) ? data.verification_status : "VERIFIED";

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const crypto = require("crypto");
    const id = crypto.randomUUID();
    const row = {
      id,
      name: String(data.name).trim(),
      city: data.city ? String(data.city).trim() || null : null,
      address: data.address ? String(data.address).trim() || null : null,
      phone: data.phone ? String(data.phone).trim() || null : null,
      instagram: data.instagram ? String(data.instagram).trim() || null : null,
      website: data.website ? String(data.website).trim() || null : null,
      verification_status: verificationStatus,
      review_count: 0,
      reservations_this_month: 0,
    };
    const { data: inserted, error } = await supabase.from("restaurants").insert(row).select("*").single();
    if (error) throw new Error(error.message);
    return mapRowToRestaurant(inserted);
  }
  const id = `rest-${Date.now()}`;
  const r = {
    id,
    name: String(data.name).trim(),
    city: data.city || null,
    address: data.address || null,
    phone: data.phone || null,
    instagram: data.instagram || null,
    verification_status: verificationStatus,
  };
  return mapRowToRestaurant(r);
}
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

/**
 * Actualiza un restaurante (admin). Soporta verification_status, rating y review_count.
 */
async function update(id, patch) {
  if (!id) return null;
  const updates = {};
  if (patch.verification_status !== undefined && VERIFICATION_STATUSES.includes(patch.verification_status)) {
    updates.verification_status = patch.verification_status;
  }
  if (patch.rating !== undefined && typeof patch.rating === "number") {
    updates.rating = patch.rating;
  }
  if (patch.reviewCount !== undefined && Number.isInteger(patch.reviewCount) && patch.reviewCount >= 0) {
    updates.review_count = patch.reviewCount;
  }
  if (Object.keys(updates).length === 0) return getById(id);

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("restaurants").update(updates).eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return mapRowToRestaurant(data);
  }
  const r = mockRestaurants.find((x) => x.id === id);
  if (!r) return null;
  if (updates.verification_status) r.verification_status = updates.verification_status;
  if (updates.rating != null) r.rating = updates.rating;
  if (updates.review_count != null) {
    r.review_count = updates.review_count;
    r.reviewCount = updates.review_count;
  }
  return mapRowToRestaurant(r);
}

module.exports = { list, getById, create, update, mapRowToRestaurant, VERIFICATION_STATUSES };
