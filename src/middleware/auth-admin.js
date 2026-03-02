/**
 * Auth mínimo para panel admin (piloto).
 * Header requerido: X-ADMIN-KEY con valor igual a ADMIN_API_KEY.
 * Respuesta 401 según contrato: { success: false, error: { code, message } }.
 */
const ADMIN_HEADER = "x-admin-key";

function sendUnauthorized(res, message = "Admin key inválida o faltante.") {
  return res.status(401).json({
    success: false,
    error: { code: "UNAUTHORIZED", message },
  });
}

function requireAdminKey(req, res, next) {
  const key = req.get(ADMIN_HEADER) || req.headers[ADMIN_HEADER];
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || typeof expected !== "string" || expected.trim() === "") {
    return sendUnauthorized(res, "Admin key no configurada en el servidor.");
  }
  if (!key || key.trim() !== expected.trim()) {
    return sendUnauthorized(res, "Admin key inválida o faltante.");
  }
  next();
}

module.exports = { requireAdminKey, sendUnauthorized };
