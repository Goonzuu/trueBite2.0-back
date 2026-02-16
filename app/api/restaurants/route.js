import { NextResponse } from "next/server";
import { restaurants } from "@/lib/mock-data";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const category = searchParams.get("category");

    let filtered = [...restaurants];

    if (city && city !== "Todas") {
      filtered = filtered.filter((r) => r.city === city);
    }

    if (category && category !== "Todos") {
      filtered = filtered.filter((r) => r.cuisineCategory === category);
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
