/**
 * Respuestas API estandarizadas (mismo contrato que el front).
 */
function errorBody(error, details = undefined, code = undefined) {
  return {
    success: false,
    error: typeof error === "string" ? error : (error && error.message) || "Error",
    ...(details !== undefined && { details }),
    ...(code !== undefined && { code }),
  };
}

function sendOk(res, data) {
  return res.status(200).json(data != null ? { success: true, data } : { success: true });
}

function sendCreated(res, data, message) {
  return res.status(201).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

function sendBadRequest(res, error, details, code = "VALIDATION") {
  return res.status(400).json(errorBody(error, details, code));
}

function sendNotFound(res, error = "Recurso no encontrado", code = "NOT_FOUND") {
  return res.status(404).json(errorBody(error, undefined, code));
}

function sendConflict(res, error, code = "SLOT_UNAVAILABLE") {
  return res.status(409).json(errorBody(error, undefined, code));
}

function sendServerError(res, error = "Error interno del servidor", code = "SERVER_ERROR") {
  return res.status(500).json(errorBody(error, undefined, code));
}

/** Contrato EPIC 2: error como objeto { code, message } */
function sendBadRequestContract(res, message = "Parámetros inválidos.", code = "VALIDATION", details = undefined) {
  return res.status(400).json({
    success: false,
    error: { code, message },
    ...(details !== undefined && { details }),
  });
}

function sendNotFoundContract(res, message = "Solicitud no encontrada.", code = "NOT_FOUND") {
  return res.status(404).json({
    success: false,
    error: { code, message },
  });
}

module.exports = {
  sendOk,
  sendCreated,
  sendBadRequest,
  sendBadRequestContract,
  sendNotFound,
  sendNotFoundContract,
  sendConflict,
  sendServerError,
};
