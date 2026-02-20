const express = require("express");
const { reviews } = require("../data/mock");
const { sendCreated, sendBadRequest, sendServerError } = require("../lib/api-response");
const { z } = require("zod");

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

let reviewsList = [...reviews];

router.get("/", (req, res) => {
  try {
    let list = [...reviewsList];
    const restaurantId = req.query.restaurantId;
    const userId = req.query.userId;
    const verified = req.query.verified;
    if (restaurantId) list = list.filter((r) => r.restaurantId === restaurantId);
    if (userId) list = list.filter((r) => r.userId === userId);
    if (verified === "true") list = list.filter((r) => r.verified === true);
    res.status(200).json({ success: true, data: list, count: list.length });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

router.post("/", (req, res) => {
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
    const newReview = {
      id: `rev-${Date.now()}`,
      ...data,
      verified: true,
      status: "VERIFIED",
      date: new Date().toISOString().split("T")[0],
      tags: data.tags ?? [],
      photos: data.photos ?? [],
    };

    reviewsList = [newReview, ...reviewsList];

    sendCreated(res, newReview, "Review creada exitosamente");
  } catch (e) {
    sendServerError(res, e.message);
  }
});

module.exports = router;