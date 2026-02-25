/**
 * Rate limit in-memory por IP para endpoints públicos (ej. onboarding).
 * Ventana fija; en producción conviene Redis o similar.
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_PER_WINDOW = 5;

const hits = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function rateLimitOnboarding(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  let record = hits.get(ip);

  if (!record) {
    record = { count: 1, resetAt: now + WINDOW_MS };
    hits.set(ip, record);
    return next();
  }

  if (now >= record.resetAt) {
    record.count = 1;
    record.resetAt = now + WINDOW_MS;
    return next();
  }

  record.count += 1;
  if (record.count > MAX_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error: "Demasiadas solicitudes. Intentá de nuevo en unos minutos.",
      code: "RATE_LIMIT_EXCEEDED",
    });
  }

  next();
}

module.exports = { rateLimitOnboarding };
