const express = require("express");
const { z } = require("zod");
const { sendServerError } = require("../lib/api-response");
const { listByUser } = require("../store/user-benefits-store");
const { listRestaurantIds, replaceAll } = require("../store/user-favorites-store");

const router = express.Router();

const favoritesPutSchema = z.object({
  userId: z.string().min(1, "userId requerido"),
  restaurantIds: z.array(z.string().min(1)),
});

/** Temporal: lista beneficios por userId (query). Cuando haya auth comensal → GET /me/benefits sin query (userId del token). */
router.get("/benefits", async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];
    const list = userId ? await listByUser(userId) : [];
    res.status(200).json({ success: true, data: list, count: list.length });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

/** Favoritos por userId (query). Misma convención temporal que /benefits. */
router.get("/favorites", async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }
    const data = await listRestaurantIds(userId);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

/** Reemplaza la lista de IDs de restaurantes favoritos del usuario. */
router.put("/favorites", async (req, res) => {
  try {
    const parsed = favoritesPutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: parsed.error.errors,
        code: "VALIDATION",
      });
    }
    const { userId, restaurantIds } = parsed.data;
    const data = await replaceAll(userId, restaurantIds);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (e) {
    if (e.message && e.message.startsWith("Restaurante no encontrado")) {
      return res.status(400).json({
        success: false,
        error: e.message,
        code: "VALIDATION",
      });
    }
    sendServerError(res, e.message);
  }
});

module.exports = router;