import { z } from "zod";
import {
  ok,
  badRequest,
  notFound,
  serverError,
  validationError,
} from "@/lib/api-response";
import {
  getReservationById,
  updateReservation as updateReservationInStore,
} from "@/lib/server-reservation-store";

const idSchema = z.string().min(1);

const updateReservationSchema = z.object({
  status: z.enum([
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "COMPLETED",
    "NO_SHOW",
    "CANCELED",
  ]),
  reviewEnabled: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    idSchema.parse(id);

    const reservation = getReservationById(id);
    if (!reservation) {
      return notFound("Reserva no encontrada");
    }

    return ok(reservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error);
    }
    return serverError(error.message);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = updateReservationSchema.safeParse(body);

    if (!validated.success) {
      return validationError(validated.error);
    }

    const reservation = getReservationById(id);
    if (!reservation) {
      return notFound("Reserva no encontrada");
    }

    const updated = updateReservationInStore(id, validated.data);
    if (!updated) {
      return notFound("Reserva no encontrada");
    }

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error);
    }
    return serverError(error.message);
  }
}
