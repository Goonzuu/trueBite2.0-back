/**
 * Cliente Supabase (service role) para uso en backend.
 * Solo para operaciones server-side; no exponer SERVICE_ROLE_KEY al cliente.
 */
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;
if (url && serviceRoleKey) {
  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function getSupabase() {
  return client;
}

function isSupabaseConfigured() {
  return Boolean(client);
}

module.exports = { getSupabase, isSupabaseConfigured };
