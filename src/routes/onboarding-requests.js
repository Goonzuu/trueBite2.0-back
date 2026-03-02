const express = require("express");
const { z } = require("zod");
const { sendCreated, sendOk, sendServerError, sendBadRequestContract, sendNotFoundContract } = require("../lib/api-response");
const { addRequest, list, updateById, getById, STATUSES } = require("../store/onboarding-requests-store");
const { rateLimitOnboarding } = require("../middleware/rate-limit-onboarding");
const { requireAdminKey } = require("../middleware/auth-admin");

const router = express.Router();

/** Honeypot: si el cliente manda este campo con valor, es bot → no guardamos pero respondemos 201. */
const HONEYPOT_FIELD = "website_url";

const requestSchema = z.object({
  restaurant_name: z.string().min(1, "Nombre del restaurante requerido"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  instagram: z.string().optional(),
  accepts_reservations: z.boolean().optional(),
  reservations_volume_estimate: z.union([z.string(), z.number()]).optional(),
});

/**
 * POST /api/onboarding-requests
 * Solicitud pública "Soy Restaurante". No requiere auth.
 * Contrato: 201 { success, data: { id, status: "PENDING" }, message }.
 */
router.post("/", rateLimitOnboarding, async (req, res) => {
  try {
    if (req.body[HONEYPOT_FIELD] && String(req.body[HONEYPOT_FIELD]).trim() !== "") {
      return sendCreated(
        res,
        { id: "ok", status: "PENDING" },
        "Solicitud recibida"
      );
    }

    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: parsed.error.errors,
        code: "VALIDATION",
      });
    }

    const created = await addRequest(parsed.data);
    return sendCreated(
      res,
      { id: created.id, status: created.status ?? "PENDING" },
      "Solicitud recibida"
    );
  } catch (e) {
    sendServerError(res, e.message);
  }
});

const querySchema = z.object({
  status: z.enum(STATUSES).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sort: z.enum(["created_at"]).optional().default("created_at"),
  order: z.enum(["desc", "asc"]).optional().default("desc"),
});

/**
 * GET /api/onboarding-requests (admin)
 * Requiere header X-ADMIN-KEY.
 * Contrato: 200 { success, data[], count, total, pagination: { limit, offset } }.
 */
router.get("/", requireAdminKey, async (req, res) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = (parsed.error.errors || []).map((e) => ({ path: e.path, message: e.message }));
      return sendBadRequestContract(res, "Parámetros inválidos.", "VALIDATION", details);
    }

    const { data, total } = await list(parsed.data);
    const limit = parsed.data.limit;
    const offset = parsed.data.offset;
    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      total,
      pagination: { limit, offset },
    });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  notes: z.string().optional(),
});

/**
 * PATCH /api/onboarding-requests/:id (admin)
 * Requiere header X-ADMIN-KEY.
 * Body: { status?, notes? }. Contrato: 200 { success, data: { id, status, notes, updated_at } }.
 */
router.patch("/:id", requireAdminKey, async (req, res) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = (parsed.error.errors || []).map((e) => ({ path: e.path, message: e.message }));
      return sendBadRequestContract(res, "Body inválido.", "VALIDATION", details);
    }

    const existing = await getById(req.params.id);
    if (!existing) return sendNotFoundContract(res, "Solicitud no encontrada.", "NOT_FOUND");

    const updated = await updateById(req.params.id, parsed.data);
    if (!updated) return sendNotFoundContract(res, "Solicitud no encontrada.", "NOT_FOUND");

    return sendOk(res, {
      id: updated.id,
      status: updated.status,
      notes: updated.notes ?? null,
      updated_at: updated.updated_at,
    });
  } catch (e) {
    if (e.message === "Status inválido") {
      return sendBadRequestContract(res, "Status inválido", "VALIDATION", [{ path: ["status"], message: "Status inválido" }]);
    }
    sendServerError(res, e.message);
  }
});

module.exports = router;
