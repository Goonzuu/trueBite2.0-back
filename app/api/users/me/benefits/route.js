import { NextResponse } from "next/server";

/**
 * Beneficios activos del usuario (fidelización).
 * Sin auth: devuelve array vacío. Con Supabase: filtrar por userId de sesión.
 */
export async function GET() {
  try {
    // TODO: con auth, leer user_benefits donde userId = sesión y used = false
    const data = [];

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
