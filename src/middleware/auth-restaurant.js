const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "truebite-dev-secret-change-in-production";

/**
 * Middleware: verifica Authorization Bearer JWT de rol restaurante.
 * Si es válido, define req.restaurantId y req.restaurantEmail.
 * Si no, responde 401.
 */
function authenticateRestaurant(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Token de sesión requerido",
      code: "UNAUTHORIZED",
    });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "restaurant" || !decoded.restaurantId) {
      return res.status(401).json({
        success: false,
        error: "Token inválido",
        code: "UNAUTHORIZED",
      });
    }
    req.restaurantId = decoded.restaurantId;
    req.restaurantEmail = decoded.email || null;
    next();
  } catch (err) {
    const isExpired = err.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      error: isExpired ? "Sesión expirada" : "Token inválido",
      code: "UNAUTHORIZED",
    });
  }
}

module.exports = { authenticateRestaurant, JWT_SECRET };
