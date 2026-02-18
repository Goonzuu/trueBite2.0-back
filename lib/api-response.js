/**
 * Respuestas API estandarizadas.
 * Todas las rutas /api/* deberían usar estos helpers para códigos HTTP y forma de error.
 */
import { NextResponse } from "next/server";

const ERROR_BODY = (error, details = undefined, code = undefined) => ({
  success: false,
  error: typeof error === "string" ? error : error?.message ?? "Error",
  ...(details !== undefined && { details }),
  ...(code !== undefined && { code }),
});

/** 200 OK */
export function ok(data, init = {}) {
  return NextResponse.json(
    { success: true, ...(data != null && { data }) },
    { status: 200, ...init }
  );
}

/** 201 Created */
export function created(data, message = undefined) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 201 }
  );
}

/** 400 Bad Request – validación (Zod u otra). code: ej. VALIDATION */
export function badRequest(error, details = undefined, code = "VALIDATION") {
  return NextResponse.json(ERROR_BODY(error, details, code), { status: 400 });
}

/** 404 Not Found */
export function notFound(error = "Recurso no encontrado", code = "NOT_FOUND") {
  return NextResponse.json(ERROR_BODY(error, undefined, code), { status: 404 });
}

/** 409 Conflict – p. ej. slot ya tomado. code: ej. SLOT_UNAVAILABLE */
export function conflict(
  error = "Conflicto con el estado actual del recurso",
  code = "CONFLICT"
) {
  return NextResponse.json(ERROR_BODY(error, undefined, code), { status: 409 });
}

/** 500 Internal Server Error */
export function serverError(
  error = "Error interno del servidor",
  code = "SERVER_ERROR"
) {
  return NextResponse.json(ERROR_BODY(error, undefined, code), {
    status: 500,
  });
}

/**
 * Devuelve badRequest con detalles de Zod y code VALIDATION.
 */
export function validationError(zodError) {
  return badRequest("Datos inválidos", zodError.errors, "VALIDATION");
}
