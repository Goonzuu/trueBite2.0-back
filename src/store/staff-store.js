const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { getSupabase, isSupabaseConfigured } = require("../lib/supabase");

const SALT_LEN = 16;
const KEY_LEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

function hashPasswordScrypt(password) {
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
  return { salt: salt.toString("base64"), hash: hash.toString("base64") };
}

function verifyPasswordScrypt(password, saltB64, hashB64) {
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** In-memory fallback cuando Supabase no está configurado. */
const memoryStaff = [];

function seedMemory() {
  const demoPassword = process.env.RESTAURANT_DEMO_PASSWORD || "demo";
  [
    { email: "costa@truebite.com", restaurantId: "1" },
    { email: "burger@truebite.com", restaurantId: "2" },
  ].forEach(({ email, restaurantId }) => {
    const { salt, hash } = hashPasswordScrypt(demoPassword);
    memoryStaff.push({
      email: email.toLowerCase(),
      restaurantId,
      passwordSalt: salt,
      passwordHash: hash,
    });
  });
}

seedMemory();

function normalizeEmail(email) {
  return (email || "").toLowerCase().trim();
}

/**
 * Busca staff por email. Con Supabase: lee tabla restaurant_staff (bcrypt).
 * Sin Supabase: usa store en memoria (scrypt).
 * @returns {Promise<{ email: string, restaurantId: string, passwordHash: string, passwordSalt?: string } | null>}
 */
async function findByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("restaurant_staff")
      .select("email, restaurant_id, password_hash")
      .eq("email", normalized)
      .limit(1);

    if (error || !data?.length) return null;
    const row = data[0];
    return {
      email: row.email,
      restaurantId: row.restaurant_id,
      passwordHash: row.password_hash,
    };
  }

  const entry = memoryStaff.find((s) => s.email === normalized) || null;
  if (!entry) return null;
  return {
    email: entry.email,
    restaurantId: entry.restaurantId,
    passwordHash: entry.passwordHash,
    passwordSalt: entry.passwordSalt,
  };
}

/**
 * Verifica contraseña contra el registro de staff.
 * Soporta bcrypt (Supabase) y scrypt (memoria).
 */
async function verifyStaffPassword(entry, password) {
  if (!entry || !password) return false;
  if (entry.passwordSalt) {
    return verifyPasswordScrypt(password, entry.passwordSalt, entry.passwordHash);
  }
  return bcrypt.compare(password, entry.passwordHash);
}

/**
 * Crea un staff para un restaurante (admin). Contraseña temporal.
 * @param {string} restaurantId - UUID del restaurante
 * @param {string} email
 * @param {string} password - contraseña temporal (se devuelve una sola vez)
 * @returns {{ email: string, password: string }}
 */
async function createStaff(restaurantId, email, password) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("Email requerido");
  if (!password || String(password).trim().length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const passwordHash = await bcrypt.hash(String(password).trim(), 10);
    const { data, error } = await supabase
      .from("restaurant_staff")
      .insert({
        email: normalized,
        restaurant_id: restaurantId,
        password_hash: passwordHash,
      })
      .select("id, email, restaurant_id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Ya existe un staff con ese email para este restaurante");
      throw new Error(error.message);
    }
    return { email: normalized, password: String(password).trim() };
  }
  throw new Error("Supabase no configurado");
}

module.exports = {
  findByEmail,
  verifyStaffPassword,
  createStaff,
};
