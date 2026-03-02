const express = require("express");
const { z } = require("zod");
const { sendOk, sendNotFoundContract, sendServerError } = require("../lib/api-response");
const { requireAdminKey } = require("../middleware/auth-admin");
const { getReservationsFilteredAdmin, getReservationById } = require("../store/reservation-store");

const router = express.Router();

const querySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/** GET /api/admin/reservations - Lista reservas (admin, solo lectura). Filtros: restaurantId, status, dateFrom, dateTo. */
router.get("/", requireAdminKey, async (req, res) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION", message: "Parámetros inválidos.", details: parsed.error.errors },
      });
    }
    const { data, total } = await getReservationsFilteredAdmin(parsed.data);
    return sendOk(res, { data, total, count: data.length });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

/** GET /api/admin/reservations/:id - Detalle de una reserva (admin, solo lectura). */
router.get("/:id", requireAdminKey, async (req, res) => {
  try {
    const reservation = await getReservationById(req.params.id);
    if (!reservation) return sendNotFoundContract(res, "Reserva no encontrada.", "NOT_FOUND");
    return sendOk(res, reservation);
  } catch (e) {
    sendServerError(res, e.message);
  }
});

module.exports = router;
