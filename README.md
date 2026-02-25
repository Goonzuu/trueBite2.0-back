# TrueBite 2.0 – Backend

API REST del proyecto TrueBite. Repositorio separado para deploy independiente del frontend.

## Requisitos

- Node.js >= 18

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

- **PORT**: Puerto del servidor (por defecto 4000).
- **CORS_ORIGIN**: Origen permitido para CORS. En local suele ser `http://localhost:3000` (donde corre el front).

## Ejecución

```bash
# Desarrollo (reinicio al cambiar archivos)
npm run dev

# Producción
npm start
```

La API queda en `http://localhost:4000`. Endpoint de salud: `GET /health`.

## Rutas (prefijo `/api`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/restaurants` | Lista restaurantes (query: city, category) |
| GET | `/api/restaurants/:id` | Detalle restaurante |
| GET | `/api/restaurants/:id/config` | Config de reservas |
| PUT | `/api/restaurants/:id/config` | Actualizar config |
| GET | `/api/restaurants/:id/availability?date=YYYY-MM-DD&guests=N` | Slots disponibles |
| GET | `/api/reservations` | Lista reservas (query: userId, restaurantId, status) |
| GET | `/api/reservations/:id` | Detalle reserva |
| POST | `/api/reservations` | Crear reserva (409 si slot ocupado) |
| PATCH | `/api/reservations/:id` | Actualizar estado |
| POST | `/api/auth/restaurant/login` | Login restaurante (body: **email, password**; el restaurante se deriva del staff) → JWT |
| POST | `/api/onboarding-requests` | Solicitud "Soy Restaurante" (público; guarda en `restaurant_onboarding_requests`). Anti-spam: rate limit por IP (5/15 min) + honeypot. |
| GET | `/api/reviews` | Lista reviews (query: restaurantId, userId) |
| POST | `/api/reviews` | Crear review |
| GET | `/api/users/me/benefits` | Beneficios del usuario (por ahora `[]`) |

**Auth restaurante:** `GET /reservations?restaurantId=X` y `PATCH /reservations/:id` requieren `Authorization: Bearer <token>`. Solo el restaurante dueño puede ver/editar sus reservas. `PUT /restaurants/:id/config` también requiere token y que `id` coincida con el restaurante logueado. **Solo restaurantes con `verification_status === 'VERIFIED'`** pueden usar el panel y recibir reservas; si no, 403 `RESTAURANT_NOT_VERIFIED`.

El contrato detallado (códigos de error, cuerpos, etc.) está en el repo del frontend: `lib/API_CONTRACT.md`.

## Conectar el frontend

En el repo del frontend (TrueBite), en `.env.local`:

```env
NEXT_PUBLIC_USE_API=true
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Con el backend corriendo en el puerto 4000 y el front en el 3000, la app usará esta API.

Para producción, despliega este backend (p. ej. Railway, Render, Fly.io) y pon en el front:

```env
NEXT_PUBLIC_USE_API=true
NEXT_PUBLIC_API_URL=https://tu-backend.vercel.app
```

**Login restaurante:** staff en **Supabase** (tabla `restaurant_staff`) o, si no está configurado, en memoria. Emails demo: `costa@truebite.com` (restaurante 1), `burger@truebite.com` (restaurante 2); contraseña la de `RESTAURANT_DEMO_PASSWORD`. Ver `docs/AUTH_PILOT.md`.

### Supabase: staff en Postgres

1. Crear proyecto en [Supabase](https://supabase.com) y copiar **Project URL** y **service_role** (Settings → API).
2. En el `.env` del backend: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Aplicar la migración: en Supabase → SQL Editor, ejecutar el contenido de **`supabase/migrations/001_restaurant_staff.sql`** (carpeta `supabase/` en la **raíz del repo**, junto a este backend).
4. Seed de cuentas demo: desde esta carpeta, `npm run seed:staff`.

Sin estas variables, el login usa el store en memoria (mismas cuentas demo).

## Estado actual

- **Config, reservas, reviews:** en memoria. Reiniciar el servidor borra cambios.
- **Restaurantes (mock):** tienen `verification_status` (VERIFIED / INVITED / etc.). Solo VERIFIED pueden operar reservas y acceder al panel.
- **Staff (login restaurante):** en Supabase/Postgres si `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están definidos; si no, en memoria. JWT y aislamiento por restaurante activos.
- **Solicitudes "Soy Restaurante":** `POST /api/onboarding-requests` guarda en tabla `restaurant_onboarding_requests` (Supabase) o en memoria. Sin auto-registro: TrueBite las revisa y da de alta manualmente.
- **Comensal:** userId por query/body (sin auth real).
- Piloto real: credenciales únicas por staff o magic link (evitar contraseña global "demo"); ver `docs/AUTH_PILOT.md`.
