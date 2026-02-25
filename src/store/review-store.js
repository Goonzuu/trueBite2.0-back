/**
 * Store de reviews: Supabase cuando está configurado, mock en memoria si no.
 */
const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");
const { reviews: initialReviews } = require("../data/mock");

let memoryList = [...initialReviews];

function mapRowToReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    reservationId: row.reservation_id,
    restaurantId: row.restaurant_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    comment: row.comment,
    verified: row.verified === true,
    categories: row.categories || {},
    tags: row.tags || [],
    photos: row.photos || [],
    date: row.date,
  };
}

async function list(filters = {}) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    let q = supabase.from("reviews").select("*").order("date", { ascending: false });
    if (filters.restaurantId) q = q.eq("restaurant_id", filters.restaurantId);
    if (filters.userId) q = q.eq("user_id", filters.userId);
    if (filters.verified === "true") q = q.eq("verified", true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(mapRowToReview);
  }
  let list_ = [...memoryList];
  if (filters.restaurantId) list_ = list_.filter((r) => r.restaurantId === filters.restaurantId);
  if (filters.userId) list_ = list_.filter((r) => r.userId === filters.userId);
  if (filters.verified === "true") list_ = list_.filter((r) => r.verified === true);
  return list_;
}

async function add(review) {
  const payload = {
    reservation_id: review.reservationId,
    restaurant_id: review.restaurantId,
    user_id: review.userId,
    user_name: review.userName,
    rating: review.rating,
    comment: review.comment,
    verified: review.verified !== false,
    categories: review.categories || {},
    tags: review.tags || [],
    photos: review.photos || [],
    date: review.date,
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("reviews").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return mapRowToReview(data);
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    ...review,
    verified: true,
    tags: review.tags ?? [],
    photos: review.photos ?? [],
  };
  memoryList = [newReview, ...memoryList];
  return newReview;
}

module.exports = { list, add, mapRowToReview };
