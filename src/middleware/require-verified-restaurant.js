const { getById: getRestaurantById } = require("../store/restaurant-store");

const VERIFIED = "VERIFIED";

/**
 * Middleware: debe ir después de authenticateRestaurant.
 * Verifica que el restaurante del token tenga verification_status === 'VERIFIED'.
 * Si no, responde 403 con code RESTAURANT_NOT_VERIFIED.
 */
async function requireVerifiedRestaurant(req, res, next) {
  const restaurantId = req.restaurantId;
  if (!restaurantId) {
    return res.status(403).json({
      success: false,
      error: "Restaurante no verificado",
      code: "RESTAURANT_NOT_VERIFIED",
    });
  }
  try {
    const restaurant = await getRestaurantById(restaurantId);
    if (!restaurant || restaurant.verification_status !== VERIFIED) {
      return res.status(403).json({
        success: false,
        error: "Tu restaurante aún no está verificado para operar reservas. Contacta a TrueBite.",
        code: "RESTAURANT_NOT_VERIFIED",
      });
    }
    next();
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "Error al verificar restaurante",
      code: "SERVER_ERROR",
    });
  }
}

module.exports = { requireVerifiedRestaurant, getRestaurantById, VERIFIED };
