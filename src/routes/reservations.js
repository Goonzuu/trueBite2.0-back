const express = require("express");
const { z } = require("zod");
const {
  sendOk,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  sendConflict,
  sendServerError,
} = require("../lib/api-response");
const { getConfig } = require("../store/config-store");
const {
  getReservations,
  getReservationById,
  getReservationsForRestaurantAndDate,
  addReservation: addReservationToStore,
  updateReservation,
} = require("../store/reservation-store");
const { getAvailableSlots, filterByMinAdvance } = require("../lib/availability");

const router = express.Router();

const reservationSchema = z.object({
  restaurantId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  guests: z.number().int().min(1).max(12),
  notes: z.string().optional(),
  appliedBenefitId: z.string().optional(),
  autoConfirmed: z.boolean().optional(),
  userId: z.string().optional(),
});

const updateSchema = z.object({
  status: z.enum(["PENDING_CONFIRMATION", "CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELED"]),
  reviewEnabled: z.boolean().optional(),
  notes: z.string().optional(),
});

router.get("/", (req, res) => {
  try {
    let list = getReservations();
    const status = req.query.status;
    const restaurantId = req.query.restaurantId;
    const userId = req.query.userId;
    if (status) list = list.filter((r) => r.status === status);
    if (restaurantId) list = list.filter((r) => r.restaurantId === restaurantId);
    if (userId) list = list.filter((r) => r.userId === userId);
    res.status(200).json({ success: true, data: list, count: list.length });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

router.get("/:id", (req, res) => {
  try {
    const r = getReservationById(req.params.id);
    if (!r) return sendNotFound(res, "Reserva no encontrada");
    sendOk(res, r);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

router.post("/", (req, res) => {
  try {
    const parsed = reservationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: parsed.error.errors,
        code: "VALIDATION",
      });
    }

    const {
      appliedBenefitId,
      autoConfirmed,
      userId,
      restaurantId,
      date,
      time,
      guests,
      notes,
    } = parsed.data;

    if (
      appliedBenefitId !== undefined &&
      appliedBenefitId !== null &&
      (typeof appliedBenefitId !== "string" || appliedBenefitId.trim() === "")
    ) {
      return sendBadRequest(res, "appliedBenefitId debe ser un identificador válido");
    }

    const config = getConfig(restaurantId);
    const existingForDay = getReservationsForRestaurantAndDate(restaurantId, date);
    let availableSlots = getAvailableSlots(config, date, guests, existingForDay);
    const minAdvance = config.rules?.minAdvanceHours ?? 1;
    availableSlots = filterByMinAdvance(availableSlots, date, minAdvance);

    if (!availableSlots.includes(time)) {
      return sendConflict(
        res,
        "El horario seleccionado ya no está disponible. Elige otro slot.",
        "SLOT_UNAVAILABLE"
      );
    }

    const status = autoConfirmed === true ? "CONFIRMED" : "PENDING_CONFIRMATION";
    const newReservation = addReservationToStore({
      id: `res-${Date.now()}`,
      restaurantId,
      date,
      time,
      guests,
      notes: notes ?? "",
      status,
      reviewed: false,
      ...(userId && { userId }),
      ...(appliedBenefitId?.trim() && { appliedBenefitId: appliedBenefitId.trim() }),
    });

    sendCreated(res, newReservation, "Reserva creada exitosamente");
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: e.errors,
        code: "VALIDATION",
      });
    }
    sendServerError(res, e.message);
  }
});

router.patch("/:id", (req, res) => {
  try {
    const id = req.params.id;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: parsed.error.errors,
        code: "VALIDATION",
      });
    }

    const r = getReservationById(id);
    if (!r) return sendNotFound(res, "Reserva no encontrada");

    const updated = updateReservation(id, parsed.data);
    sendOk(res, updated);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

module.exports = router;