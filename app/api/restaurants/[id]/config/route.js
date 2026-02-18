import { z } from "zod";
import { getConfig, setConfig } from "@/lib/server-config-store";
import { ok, badRequest, serverError, validationError } from "@/lib/api-response";

const idSchema = z.string().min(1);

const timeRangeSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
});

const areaSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  capacityPeople: z.number().int().min(1),
  minPartySize: z.number().int().min(1),
  maxPartySize: z.number().int().min(1),
});

const configSchema = z.object({
  restaurantId: z.string().optional(),
  reservationsEnabled: z.boolean().optional(),
  reservationsPaused: z.boolean().optional(),
  wizardCompleted: z.boolean().optional(),
  confirmationMode: z.enum(["auto", "manual"]).optional(),
  openingHours: z.record(z.array(timeRangeSchema)).optional(),
  areas: z.array(areaSchema).optional(),
  rules: z
    .object({
      durationMinutes: z.number().int().min(15),
      bufferMinutes: z.number().int().min(0),
      maxPeoplePerReservation: z.number().int().min(1),
      minAdvanceHours: z.number().min(0),
    })
    .optional(),
});

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    idSchema.parse(id);
    const config = getConfig(id);
    return ok(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error);
    }
    return serverError(error.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = configSchema.safeParse(body);

    if (!validated.success) {
      return validationError(validated.error);
    }

    const current = getConfig(id);
    const merged = { ...current, ...validated.data, restaurantId: id };
    const updated = setConfig(id, merged);

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error);
    }
    return serverError(error.message);
  }
}
