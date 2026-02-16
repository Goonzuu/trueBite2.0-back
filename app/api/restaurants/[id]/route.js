import { NextResponse } from "next/server";
import { restaurants } from "@/lib/mock-data";
import { z } from "zod";

const idSchema = z.string().min(1);

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Validar ID
    idSchema.parse(id);

    const restaurant = restaurants.find((r) => r.id === id);

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurante no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: restaurant,
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
