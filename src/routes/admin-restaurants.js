const express = require("express");
const { z } = require("zod");
const { sendOk, sendCreated, sendBadRequestContract, sendNotFoundContract, sendServerError } = require("../lib/api-response");
const { requireAdminKey } = require("../middleware/auth-admin");
const { list, getById, create, update, VERIFICATION_STATUSES } = require("../store/restaurant-store");
const { createStaff } = require("../store/staff-store");

const router = express.Router();

/** GET /api/admin/restaurants - Lista restaurantes (admin). Query: q (búsqueda por nombre). */
router.get("/", requireAdminKey, async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const restaurants = await list({ q: q || undefined });
    return sendOk(res, { data: restaurants, count: restaurants.length });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

const createSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  verification_status: z.enum(["VERIFIED", "UNDER_REVIEW"]).optional().default("VERIFIED"),
  onboarding_request_id: z.string().uuid().optional(),
});

/** POST /api/admin/restaurants - Crea restaurante (admin). */
router.post("/", requireAdminKey, async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = (parsed.error.errors || []).map((e) => ({ path: e.path, message: e.message }));
      return sendBadRequestContract(res, "Datos inválidos.", "VALIDATION", details);
    }
    const created = await create(parsed.data);
    return sendCreated(res, created, "Restaurante creado");
  } catch (e) {
    sendServerError(res, e.message);
  }
});

const patchSchema = z.object({
  verification_status: z.enum(VERIFICATION_STATUSES),
});

/** PATCH /api/admin/restaurants/:id - Actualiza restaurante (ej. verification_status para habilitar/suspender). */
router.patch("/:id", requireAdminKey, async (req, res) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = (parsed.error.errors || []).map((e) => ({ path: e.path, message: e.message }));
      return sendBadRequestContract(res, "Body inválido.", "VALIDATION", details);
    }
    const existing = await getById(req.params.id);
    if (!existing) return sendNotFoundContract(res, "Restaurante no encontrado.", "NOT_FOUND");
    const updated = await update(req.params.id, parsed.data);
    return sendOk(res, updated);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

const staffSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

/** POST /api/admin/restaurants/:id/staff - Crea staff para el restaurante. Devuelve credenciales una vez. */
router.post("/:id/staff", requireAdminKey, async (req, res) => {
  try {
    const parsed = staffSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = (parsed.error.errors || []).map((e) => ({ path: e.path, message: e.message }));
      return sendBadRequestContract(res, "Datos inválidos.", "VALIDATION", details);
    }
    const restaurant = await getById(req.params.id);
    if (!restaurant) return sendNotFoundContract(res, "Restaurante no encontrado.", "NOT_FOUND");
    const credentials = await createStaff(req.params.id, parsed.data.email, parsed.data.password);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://truebite.uy";
    return sendCreated(res, {
      email: credentials.email,
      password: credentials.password,
      message_for_wa: `Hola, ya tenés acceso al panel TrueBite. Email: ${credentials.email} Contraseña: ${credentials.password} Entrá en: ${appUrl}/restaurante/login`,
    }, "Staff creado. Guardá las credenciales para enviar al restaurante.");
  } catch (e) {
    if (e.message.includes("Ya existe")) return sendBadRequestContract(res, e.message, "CONFLICT");
    sendServerError(res, e.message);
  }
});

module.exports = router;
