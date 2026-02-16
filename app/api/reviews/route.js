import { NextResponse } from "next/server";
import { z } from "zod";
import { reviews } from "@/lib/mock-data";

const reviewSchema = z.object({
  reservationId: z.string().min(1, "reservationId es requerido"),
  restaurantId: z.string().min(1, "restaurantId es requerido"),
  userId: z.string().min(1, "userId es requerido"),
  userName: z.string().min(1, "userName es requerido"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "El comentario debe tener al menos 10 caracteres"),
  categories: z.object({
    food: z.number().int().min(1).max(5),
    service: z.number().int().min(1).max(5),
    ambiance: z.number().int().min(1).max(5),
    value: z.number().int().min(1).max(5),
  }),
  tags: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const userId = searchParams.get("userId");
    const verified = searchParams.get("verified");

    let filtered = [...reviews];

    if (restaurantId) {
      filtered = filtered.filter((r) => r.restaurantId === restaurantId);
    }

    if (userId) {
      filtered = filtered.filter((r) => r.userId === userId);
    }

    if (verified === "true") {
      filtered = filtered.filter((r) => r.verified === true);
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
    const validated = reviewSchema.parse(body);

    // Crear nueva review
    const newReview = {
      id: `rev-${Date.now()}`,
      ...validated,
      verified: true,
      status: "VERIFIED",
      date: new Date().toISOString().split("T")[0],
      tags: validated.tags || [],
      photos: validated.photos || [],
    };

    // En producción, aquí se guardaría en la base de datos
    // También se actualizaría el rating del restaurante
    // Y se marcaría la reserva como reviewed

    return NextResponse.json(
      {
        success: true,
        data: newReview,
        message: "Review creada exitosamente",
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
