/**
 * Seed de cuentas demo en restaurant_staff (Supabase).
 * Ejecutar tras aplicar migraciones 005 y 006: npm run seed:staff
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.
 * restaurant_id debe ser UUID de public.restaurants (ej. a0000001-... para Costa, a0000002-... para La Esquina).
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");

const RESTAURANT_IDS = {
  "1": "a0000001-0000-4000-8000-000000000001",
  "2": "a0000002-0000-4000-8000-000000000002",
};

const DEMO_ACCOUNTS = [
  { email: "costa@truebite.com", restaurant_id: RESTAURANT_IDS["1"] },
  { email: "burger@truebite.com", restaurant_id: RESTAURANT_IDS["2"] },
];

const DEMO_PASSWORD = process.env.RESTAURANT_DEMO_PASSWORD || "demo";
const BCRYPT_ROUNDS = 10;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  for (const { email, restaurant_id } of DEMO_ACCOUNTS) {
    const normalized = email.toLowerCase().trim();
    const { error } = await supabase.from("restaurant_staff").upsert(
      {
        email: normalized,
        restaurant_id,
        password_hash: passwordHash,
      },
      { onConflict: "email,restaurant_id" }
    );
    if (error) {
      console.error("Error insertando", normalized, error.message);
      process.exit(1);
    }
    console.log("OK:", normalized, "→ restaurante", restaurant_id);
  }
  console.log("Seed restaurant_staff listo.");
}

main();
