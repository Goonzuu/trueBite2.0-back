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
const { getById: getBenefitById, markUsed: markBenefitUsed } = require("../store/user-benefits-store");
const {
  getReservations,
  getReservationsFiltered,
  getReservationById,
  getReservationsForRestaurantAndDate,
  addReservation: addReservationToStore,
  updateReservation,
} = require("../store/reservation-store");
const { getAvailableSlots, filterByMinAdvance } = require("../lib/availability");
const { authenticateRestaurant } = require("../middleware/auth-restaurant");
const { requireVerifiedRestaurant, getRestaurantById } = require("../middleware/require-verified-restaurant");

const router = express.Router();

function sendForbidden(res, message = "No tienes acceso a este recurso") {
  return res.status(403).json({ success: false, error: message, code: "FORBIDDEN" });
}

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

router.get("/", async (req, res, next) => {
  const restaurantId = req.query.restaurantId;
  if (restaurantId) {
    return authenticateRestaurant(req, res, (err) => {
      if (err) return next(err);
      if (req.restaurantId !== restaurantId) return sendForbidden(res);
      return requireVerifiedRestaurant(req, res, async () => {
        try {
          const status = req.query.status || undefined;
          const dateFrom = req.query.dateFrom || undefined;
          const dateTo = req.query.dateTo || undefined;
          const limit = req.query.limit || undefined;
          const offset = req.query.offset || undefined;
          const { data, total } = await getReservationsFiltered({
            restaurantId,
            status,
            dateFrom,
            dateTo,
            limit,
            offset,
          });
          return res.status(200).json({ success: true, data, count: data.length, total });
        } catch (e) {
          return sendServerError(res, e.message);
        }
      });
    });
  }
  try {
    let list = await getReservations();
    const status = req.query.status;
    const userId = req.query.userId;
    if (status) list = list.filter((r) => r.status === status);
    if (userId) list = list.filter((r) => r.userId === userId);
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    if (dateFrom) list = list.filter((r) => r.date >= dateFrom);
    if (dateTo) list = list.filter((r) => r.date <= dateTo);
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 500);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const total = list.length;
    list = list.slice(offset, offset + limit);
    res.status(200).json({ success: true, data: list, count: list.length, total });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const r = await getReservationById(req.params.id);
    if (!r) return sendNotFound(res, "Reserva no encontrada");
    sendOk(res, r);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

router.post("/", async (req, res) => {
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

    const restaurant = await getRestaurantById(restaurantId);
    if (!restaurant || restaurant.verification_status !== "VERIFIED") {
      return res.status(403).json({
        success: false,
        error: "Este restaurante no acepta reservas en este momento.",
        code: "RESTAURANT_NOT_VERIFIED",
      });
    }

    if (
      appliedBenefitId !== undefined &&
      appliedBenefitId !== null &&
      (typeof appliedBenefitId !== "string" || appliedBenefitId.trim() === "")
    ) {
      return sendBadRequest(res, "appliedBenefitId debe ser un identificador válido");
    }

    if (appliedBenefitId?.trim()) {
      const benefit = await getBenefitById(appliedBenefitId.trim());
      if (!benefit) {
        return sendBadRequest(res, "El beneficio indicado no existe.", undefined, "BENEFIT_NOT_FOUND");
      }
      if (benefit.userId !== (userId || "")) {
        return res.status(403).json({
          success: false,
          error: "El beneficio no pertenece al usuario de la reserva.",
          code: "BENEFIT_NOT_OWNED",
        });
      }
      if (benefit.restaurantId !== restaurantId) {
        return sendBadRequest(res, "El beneficio no corresponde a este restaurante.", undefined, "BENEFIT_WRONG_RESTAURANT");
      }
      if (benefit.used) {
        return sendBadRequest(res, "El beneficio ya fue utilizado.", undefined, "BENEFIT_ALREADY_USED");
      }
      if (benefit.expiresAt && new Date(benefit.expiresAt) <= new Date()) {
        return sendBadRequest(res, "El beneficio está vencido.", undefined, "BENEFIT_EXPIRED");
      }
    }

    const config = await getConfig(restaurantId);
    const existingForDay = await getReservationsForRestaurantAndDate(restaurantId, date);
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
    const newReservation = await addReservationToStore({
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

    if (appliedBenefitId?.trim()) {
      try {
        await markBenefitUsed(appliedBenefitId.trim());
      } catch (e) {
        console.warn("[reservations] markBenefitUsed failed:", e.message);
      }
    }

    sendCreated(res, newReservation, "Reserva creada exitosamente");
  } catch (e) {
    if (e.code === "SLOT_UNAVAILABLE") {
      return sendConflict(res, e.message, "SLOT_UNAVAILABLE");
    }
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

router.patch("/:id", authenticateRestaurant, requireVerifiedRestaurant, async (req, res) => {
  try {
    const id = req.params.id;
    const r = await getReservationById(id);
    if (!r) return sendNotFound(res, "Reserva no encontrada");
    if (r.restaurantId !== req.restaurantId) return sendForbidden(res);

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: parsed.error.errors,
        code: "VALIDATION",
      });
    }

    const newStatus = parsed.data.status;
    if (newStatus !== undefined && newStatus !== r.status) {
      const allowed = {
        PENDING_CONFIRMATION: ["CONFIRMED", "CANCELED"],
        CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELED"],
        COMPLETED: [],
        NO_SHOW: [],
        CANCELED: [],
      };
      const allowedNext = allowed[r.status];
      if (!Array.isArray(allowedNext) || !allowedNext.includes(newStatus)) {
        return sendBadRequest(
          res,
          `No se puede cambiar el estado de ${r.status} a ${newStatus}.`,
          undefined,
          "INVALID_STATE_TRANSITION"
        );
      }
    }

    const updated = await updateReservation(id, parsed.data);
    sendOk(res, updated);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

module.exports = router;