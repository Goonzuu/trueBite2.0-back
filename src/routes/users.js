const express = require("express");
const { sendOk, sendServerError } = require("../lib/api-response");
const { listByUser } = require("../store/user-benefits-store");

const router = express.Router();

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

module.exports = router;