import { NextResponse } from "next/server";
import { z } from "zod";
import { reservations } from "@/lib/mock-data";

const reservationSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId es requerido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:MM)"),
  guests: z.number().int().min(1).max(12),
  notes: z.string().optional(),
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const restaurantId = searchParams.get("restaurantId");

    let filtered = [...reservations];

    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    if (restaurantId) {
      filtered = filtered.filter((r) => r.restaurantId === restaurantId);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validar con Zod
    const validated = reservationSchema.parse(body);

    // Crear nueva reserva
    const newReservation = {
      id: `res-${Date.now()}`,
      ...validated,
      status: "PENDING_CONFIRMATION",
      reviewed: false,
      notes: validated.notes || "",
    };

    // En producción, aquí se guardaría en la base de datos
    // Por ahora, solo retornamos la reserva creada

    return NextResponse.json(
      {
        success: true,
        data: newReservation,
        message: "Reserva creada exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
