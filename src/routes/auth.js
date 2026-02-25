const express = require("express");
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const { sendServerError } = require("../lib/api-response");
const { JWT_SECRET } = require("../middleware/auth-restaurant");
const { findByEmail, verifyStaffPassword } = require("../store/staff-store");
const { getById: getRestaurantById } = require("../store/restaurant-store");

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

/** Duración de la sesión (7 días). */
const TOKEN_EXPIRY = "7d";

/**
 * POST /api/auth/restaurant/login
 * Body: { email, password } — restaurantId se deriva del staff (email → restaurante).
 * Valida credenciales contra store/DB de staff y emite JWT.
 * Devuelve { success, data: { token, restaurantId, email } }.
 */
router.post("/restaurant/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: parsed.error.errors,
        code: "VALIDATION",
      });
    }

    const { email, password } = parsed.data;

    const staffEntry = await findByEmail(email);
    if (!staffEntry) {
      return res.status(401).json({
        success: false,
        error: "Email o contraseña incorrectos",
        code: "UNAUTHORIZED",
      });
    }

    const valid = await verifyStaffPassword(staffEntry, password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: "Email o contraseña incorrectos",
        code: "UNAUTHORIZED",
      });
    }

    const restaurantId = staffEntry.restaurantId;
    const restaurant = await getRestaurantById(restaurantId);
    if (!restaurant) {
      return res.status(401).json({
        success: false,
        error: "Restaurante no encontrado",
        code: "UNAUTHORIZED",
      });
    }

    const token = jwt.sign(
      {
        restaurantId,
        email: staffEntry.email,
        role: "restaurant",
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        restaurantId,
        email: staffEntry.email,
      },
    });
  } catch (e) {
    sendServerError(res, e.message);
  }
});

module.exports = router;
