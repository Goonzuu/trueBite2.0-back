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
| GET | `/api/reviews` | Lista reviews (query: restaurantId, userId) |
| POST | `/api/reviews` | Crear review |
| GET | `/api/users/me/benefits` | Beneficios del usuario (por ahora `[]`) |

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

## Estado actual

- Datos en **memoria** (config, reservas, reviews). Reiniciar el servidor borra cambios.
- **userId** por query/body (sin auth real).
- Próximo paso: **Supabase** (Auth + Postgres + RLS) y persistencia real.
