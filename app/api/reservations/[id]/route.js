import { NextResponse } from "next/server";
import { z } from "zod";
import { reservations } from "@/lib/mock-data";

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

    const reservation = reservations.find((r) => r.id === id);

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "ID inválido", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = updateReservationSchema.parse(body);

    // Buscar reserva
    const reservation = reservations.find((r) => r.id === id);

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar reserva
    const updated = {
      ...reservation,
      ...validated,
    };

    // En producción, aquí se actualizaría en la base de datos
    // Por ahora, solo retornamos la reserva actualizada

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Reserva actualizada exitosamente",
    });
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
