-- Tabla staff por restaurante: email → restaurant_id + password_hash (bcrypt).
-- Para piloto real: credenciales únicas por cuenta o magic link; no contraseña global.

CREATE TABLE IF NOT EXISTS restaurant_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, restaurant_id)
);

-- Índice para login por email (puede haber varias filas si un staff gestiona varios restaurantes).
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_email ON restaurant_staff (lower(trim(email)));

-- RLS: solo el backend (service_role) debe acceder; no exponer a anon.
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;

-- Política que deniega todo por defecto; el service_role las bypass.
CREATE POLICY "Service role only"
  ON restaurant_staff
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE restaurant_staff IS 'Staff de restaurantes: login por email, restaurant_id derivado. Piloto real: credenciales únicas o magic link.';
