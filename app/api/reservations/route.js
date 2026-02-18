import { NextResponse } from "next/server";
import { z } from "zod";
import {
  created,
  badRequest,
  conflict,
  serverError,
  validationError,
} from "@/lib/api-response";
import { getConfig } from "@/lib/server-config-store";
import {
  getReservations,
  getReservationsForRestaurantAndDate,
  addReservation as addReservationToStore,
} from "@/lib/server-reservation-store";
import { getAvailableSlots, filterByMinAdvance } from "@/lib/availability";

const reservationSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId es requerido"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:mm)"),
  guests: z.number().int().min(1).max(12),
  notes: z.string().optional(),
  appliedBenefitId: z.string().optional(),
  autoConfirmed: z.boolean().optional(),
  userId: z.string().optional(),
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const restaurantId = searchParams.get("restaurantId");
    const userId = searchParams.get("userId");

    let filtered = getReservations();

    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (restaurantId) {
      filtered = filtered.filter((r) => r.restaurantId === restaurantId);
    }
    if (userId) {
      filtered = filtered.filter((r) => r.userId === userId);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
    });
  } catch (error) {
    return serverError(error.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = reservationSchema.safeParse(body);

    if (!validated.success) {
      return validationError(validated.error);
    }

    const {
      appliedBenefitId,
      autoConfirmed,
      userId,
      restaurantId,
      date,
      time,
      guests,
      notes,
    } = validated.data;

    // Validación y aplicación de beneficio: guardamos appliedBenefitId en la reserva.
    // Con Supabase: validar que el beneficio existe, pertenece al usuario y no está usado.
    if (
      appliedBenefitId !== undefined &&
      appliedBenefitId !== null &&
      (typeof appliedBenefitId !== "string" || appliedBenefitId.trim() === "")
    ) {
      return badRequest("appliedBenefitId debe ser un identificador válido");
    }

    const config = getConfig(restaurantId);
    const existingForDay = getReservationsForRestaurantAndDate(
      restaurantId,
      date
    );
    let availableSlots = getAvailableSlots(
      config,
      date,
      guests,
      existingForDay
    );
    const minAdvance = config.rules?.minAdvanceHours ?? 1;
    availableSlots = filterByMinAdvance(availableSlots, date, minAdvance);

    if (!availableSlots.includes(time)) {
      return conflict(
        "El horario seleccionado ya no está disponible. Elige otro slot.",
        "SLOT_UNAVAILABLE"
      );
    }

    const isAuto = autoConfirmed === true;
    const status = isAuto ? "CONFIRMED" : "PENDING_CONFIRMATION";

    const newReservation = addReservationToStore({
      id: `res-${Date.now()}`,
      restaurantId,
      date,
      time,
      guests,
      notes: notes ?? "",
      status,
      reviewed: false,
      ...(userId && { userId }),
      ...(appliedBenefitId?.trim() && { appliedBenefitId: appliedBenefitId.trim() }),
    });

    return created(newReservation, "Reserva creada exitosamente");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error);
    }
    return serverError(error.message);
  }
}
