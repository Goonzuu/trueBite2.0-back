# Auth y datos para piloto real

## 1. Verificación JWT en el servidor

- **Sí está verificada.** El middleware `authenticateRestaurant` usa `jwt.verify(token, JWT_SECRET)` en cada petición a rutas protegidas.
- Los permisos (qué restaurante puede ver/editar) se basan **solo** en el payload del token verificado en el servidor (`decoded.restaurantId`). El cliente no puede elegir otro `restaurantId`; si manipula el token, la firma falla y responde 401.
- La expiración se comprueba en el servidor; el cliente solo usa la expiración para UX (redirigir antes de que falle la siguiente petición).

## 2. Config público (GET /api/restaurants/:id/config)

- Es **público** a propósito: la app de comensales necesita leer disponibilidad y reglas sin estar autenticada.
- Lo que se expone es **solo operativo**, no sensible:
  - `restaurantId`, `reservationsEnabled`, `reservationsPaused`, `wizardCompleted`
  - `openingHours`, `areas` (nombre, capacidad, min/max comensales)
  - `rules` (duración, buffer, max personas, antelación mínima)
  - `confirmationMode`
- **No** se exponen: contraseñas, emails de staff, datos de pago ni PII. Para piloto real conviene revisar si se añaden más campos y mantener esta línea (solo datos necesarios para mostrar disponibilidad y reglas).

## 3. Tabla necesaria para piloto real

Para (1) no enviar `restaurantId` en el login y (2) no usar contraseña global "demo", hace falta **persistir la relación staff → restaurante y las credenciales**. Sí, hay que construir una tabla (o equivalente).

### Esquema recomendado: `restaurant_staff`

| Columna        | Tipo        | Descripción |
|----------------|-------------|-------------|
| `id`           | UUID / PK   | Identificador único |
| `email`        | string      | Email del staff |
| `restaurant_id`| FK → restaurants | Restaurante que gestiona este usuario |
| `password_hash`| string      | Hash de la contraseña (bcrypt recomendado en producción) |
| `created_at`   | timestamp   | Alta del usuario |
| `updated_at`   | timestamp   | Última actualización (trigger en UPDATE) |

- **UNIQUE(email, restaurant_id):** un mismo email puede tener varias filas (una por restaurante). Para piloto se devuelve el primer restaurante encontrado; después se puede devolver lista para que el usuario elija.
- **Alternativa magic link:** se puede añadir tabla `magic_links` (token, email, restaurant_id, expires_at) y no usar `password_hash`; el login sería "envío link por email" y al hacer clic se crea sesión JWT.

### Uso en el login

- Body del login: solo `{ email, password }` (o solo email si es magic link).
- Backend: busca en `restaurant_staff` por `email`, verifica contraseña contra `password_hash`, obtiene `restaurant_id` y emite JWT con ese `restaurantId`. No se acepta `restaurantId` en el body.

### Implementación actual

- **Con Supabase:** el backend usa la tabla `restaurant_staff` en Postgres (migración en `supabase/migrations/001_restaurant_staff.sql`). Contraseñas con bcrypt. Cuentas demo se insertan con `npm run seed:staff` (costa@truebite.com, burger@truebite.com; contraseña por `RESTAURANT_DEMO_PASSWORD`).
- **Sin Supabase:** fallback en memoria (scrypt) con las mismas cuentas demo para desarrollo local.
- **Piloto real:** evitar contraseña global "demo"; usar credenciales únicas por staff o flujo magic link. La tabla ya permite un `password_hash` distinto por fila.

## 4. Estados de verificación de restaurante

- **Ahora:** solo restaurantes con `verification_status === 'VERIFIED'` pueden usar el panel (reservas, config) y recibir reservas. Cualquier otro estado (INVITED, UNDER_REVIEW, etc.) recibe 403 `RESTAURANT_NOT_VERIFIED` en rutas protegidas y no puede recibir reservas vía POST /reservations.
- **Decisión PO actual:** bloquear todo lo que no sea VERIFIED; no hay acceso parcial.
- **Futuro (pre-verified):** se podría definir un modo "pre-verified" donde INVITED o UNDER_REVIEW tengan acceso parcial, por ejemplo: completar wizard de configuración (horarios, áreas) antes de la verificación, o ver un panel limitado (sin recibir reservas). El middleware `requireVerifiedRestaurant` es deliberadamente rígido hoy; si más adelante se habilita acceso parcial, conviene separar rutas "solo VERIFIED" (operar reservas) vs rutas "INVITED/UNDER_REVIEW permitidos" (completar perfil/wizard).

## 5. Identificadores de restaurante

- **MVP:** `restaurant_id` y `restaurants.id` en mock y en tablas son **text** (ej. "1", "2"). Adecuado para piloto.
- **A futuro en Supabase:** cuando exista tabla `restaurants` en Postgres, es recomendable usar **UUID** como PK para `restaurants.id` y que `restaurant_staff.restaurant_id` sea FK a ese UUID. No urgente.
