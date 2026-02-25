const express = require("express");
const { getConfig } = require("../store/config-store");
const { getReservationsForRestaurantAndDate } = require("../store/reservation-store");
const { getAvailableSlots, filterByMinAdvance } = require("../lib/availability");
const {
  sendOk,
  sendBadRequest,
  sendNotFound,
  sendServerError,
} = require("../lib/api-response");
const { z } = require("zod");
const { authenticateRestaurant } = require("../middleware/auth-restaurant");
const { requireVerifiedRestaurant } = require("../middleware/require-verified-restaurant");
const { list: listRestaurants, getById: getRestaurantById } = require("../store/restaurant-store");

const router = express.Router();

/** Respuesta 403 cuando el restaurante no puede acceder al recurso */
function sendForbidden(res, message = "No tienes acceso a este recurso") {
  return res.status(403).json({ success: false, error: message, code: "FORBIDDEN" });
}

router.get("/", async (req, res) => {
  try {
    const list = await listRestaurants({
      city: req.query.city,
      category: req.query.category,
    });
    res.status(200).json({ success: true, data: list, count: list.length });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const r = await getRestaurantById(id);
    if (!r) return sendNotFound(res, "Restaurante no encontrado");
    sendOk(res, r);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

/** GET config: lectura pública (comensal necesita ver disponibilidad). */
router.get("/:id/config", async (req, res) => {
  try {
    const id = req.params.id;
    const config = await getConfig(id);
    sendOk(res, config);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

const configSchema = z.object({
  reservationsEnabled: z.boolean().optional(),
  reservationsPaused: z.boolean().optional(),
  wizardCompleted: z.boolean().optional(),
  confirmationMode: z.enum(["auto", "manual"]).optional(),
  openingHours: z.record(z.array(z.object({ open: z.string(), close: z.string() }))).optional(),
  areas: z.array(z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean(),
    capacityPeople: z.number(),
    minPartySize: z.number(),
    maxPartySize: z.number(),
  })).optional(),
  rules: z.object({
    durationMinutes: z.number().optional(),
    bufferMinutes: z.number().optional(),
    maxPeoplePerReservation: z.number().optional(),
    minAdvanceHours: z.number().optional(),
  }).optional(),
});

const { setConfig } = require("../store/config-store");

router.put("/:id/config", authenticateRestaurant, requireVerifiedRestaurant, async (req, res) => {
  try {
    const id = req.params.id;
    if (req.restaurantId !== id) return sendForbidden(res);
    const parsed = configSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: parsed.error.errors,
        code: "VALIDATION",
      });
    }
    const current = await getConfig(id);
    const merged = { ...current, ...parsed.data, restaurantId: id };
    const updated = await setConfig(id, merged);
    sendOk(res, updated);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

router.get("/:id/availability", async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const date = req.query.date;
    const guestsParam = req.query.guests;
    if (!date || !guestsParam) {
      return sendBadRequest(res, "Query params date y guests son requeridos");
    }
    const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
    const guestsSchema = z.coerce.number().int().min(1).max(20);
    dateSchema.parse(date);
    const guests = guestsSchema.parse(guestsParam);

    const config = await getConfig(restaurantId);
    const existingForDay = await getReservationsForRestaurantAndDate(restaurantId, date);
    let slots = getAvailableSlots(config, date, guests, existingForDay);
    const minAdvance = config.rules?.minAdvanceHours ?? 1;
    slots = filterByMinAdvance(slots, date, minAdvance);

    sendOk(res, slots);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return sendBadRequest(res, "Parámetros inválidos", e.errors);
    }
    sendServerError(res, e.message);
  }
});

module.exports = router;