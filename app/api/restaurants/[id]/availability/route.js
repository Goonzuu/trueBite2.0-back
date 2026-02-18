import { z } from "zod";
import { getConfig } from "@/lib/server-config-store";
import { getReservationsForRestaurantAndDate } from "@/lib/server-reservation-store";
import { getAvailableSlots, filterByMinAdvance } from "@/lib/availability";
import { badRequest, serverError } from "@/lib/api-response";

const idSchema = z.string().min(1);

export async function GET(request, { params }) {
  try {
    const { id: restaurantId } = await params;
    idSchema.parse(restaurantId);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const guestsParam = searchParams.get("guests");

    if (!date || !guestsParam) {
      return badRequest("Query params date y guests son requeridos");
    }

    const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
    const guestsSchema = z.coerce.number().int().min(1).max(20);
    dateSchema.parse(date);
    const guests = guestsSchema.parse(guestsParam);

    const config = getConfig(restaurantId);
    const existingForDay = getReservationsForRestaurantAndDate(
      restaurantId,
      date
    );
    let slots = getAvailableSlots(config, date, guests, existingForDay);
    const minAdvance = config.rules?.minAdvanceHours ?? 1;
    slots = filterByMinAdvance(slots, date, minAdvance);

    return Response.json({ success: true, data: slots });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Parámetros inválidos", error.errors);
    }
    return serverError(error.message);
  }
}
