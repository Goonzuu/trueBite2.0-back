const express = require("express");
const { z } = require("zod");
const { sendCreated, sendServerError } = require("../lib/api-response");
const { addRequest } = require("../store/onboarding-requests-store");
const { rateLimitOnboarding } = require("../middleware/rate-limit-onboarding");

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
  reservations_volume_estimate: z.string().optional(),
});

/**
 * POST /api/onboarding-requests
 * Solicitud pública "Soy Restaurante". No requiere auth.
 * Anti-spam: rate limit por IP + honeypot (campo website_url oculto; si viene lleno, no se guarda).
 */
router.post("/", rateLimitOnboarding, async (req, res) => {
  try {
    if (req.body[HONEYPOT_FIELD] && String(req.body[HONEYPOT_FIELD]).trim() !== "") {
      return sendCreated(
        res,
        { id: "ok", created_at: new Date().toISOString() },
        "Solicitud recibida. Nos pondremos en contacto contigo."
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
      { id: created.id, created_at: created.created_at },
      "Solicitud recibida. Nos pondremos en contacto contigo."
    );
  } catch (e) {
    sendServerError(res, e.message);
  }
});

module.exports = router;
