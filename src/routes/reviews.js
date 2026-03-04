const express = require("express");
const { sendCreated, sendBadRequest, sendNotFound, sendServerError } = require("../lib/api-response");
const { z } = require("zod");
const { list: listReviews, add: addReview } = require("../store/review-store");
const { getReservationById, updateReservation } = require("../store/reservation-store");
const { getById: getRestaurantById, update: updateRestaurant } = require("../store/restaurant-store");

const router = express.Router();

const reviewSchema = z.object({
  reservationId: z.string().min(1),
  restaurantId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10),
  categories: z.object({
    food: z.number().int().min(1).max(5),
    service: z.number().int().min(1).max(5),
    ambiance: z.number().int().min(1).max(5),
    value: z.number().int().min(1).max(5),
  }),
  tags: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
});

router.get("/", async (req, res) => {
  try {
    const list = await listReviews({
      restaurantId: req.query.restaurantId,
      userId: req.query.userId,
      verified: req.query.verified,
    });
    res.status(200).json({ success: true, data: list, count: list.length });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: parsed.error.errors,
        code: "VALIDATION",
      });
    }

    const data = parsed.data;

    // EPIC 4.1: solo permitir review si la reserva está COMPLETED
    const reservation = await getReservationById(data.reservationId);
    if (!reservation) {
      return sendNotFound(res, "Reserva no encontrada", "RESERVATION_NOT_FOUND");
    }
    if (reservation.status !== "COMPLETED") {
      return sendBadRequest(
        res,
        "Solo podés dejar review de una reserva completada. El estado actual de esta reserva es: " +
          (reservation.status === "PENDING_CONFIRMATION"
            ? "pendiente de confirmación"
            : reservation.status === "CONFIRMED"
              ? "confirmada"
              : reservation.status.replace(/_/g, " ").toLowerCase()) +
          ".",
        undefined,
        "RESERVATION_NOT_COMPLETED"
      );
    }
    if (reservation.reviewed) {
      return sendBadRequest(
        res,
        "Ya dejaste una review para esta reserva.",
        undefined,
        "ALREADY_REVIEWED"
      );
    }

    const newReview = await addReview({
      reservationId: data.reservationId,
      restaurantId: data.restaurantId,
      userId: data.userId,
      userName: data.userName,
      rating: data.rating,
      comment: data.comment,
      verified: true,
      categories: data.categories,
      tags: data.tags ?? [],
      photos: data.photos ?? [],
      date: new Date().toISOString().split("T")[0],
    });

    // Marcar reserva como revisada
    await updateReservation(data.reservationId, { reviewEnabled: true });

    // EPIC 4.2: actualizar rating agregado del restaurante (campos rating, review_count)
    const restaurant = await getRestaurantById(data.restaurantId);
    if (restaurant) {
      const currentCount = restaurant.reviewCount ?? 0;
      const currentRating = restaurant.rating ?? 0;
      const newCount = currentCount + 1;
      const newRating = (currentRating * currentCount + data.rating) / newCount;
      const roundedRating = Math.round(newRating * 100) / 100;
      await updateRestaurant(data.restaurantId, {
        rating: roundedRating,
        reviewCount: newCount,
      });
    }

    sendCreated(res, newReview, "Review creada exitosamente");
  } catch (e) {
    sendServerError(res, e.message);
  }
});

module.exports = router;