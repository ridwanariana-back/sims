// app/api/chart-proxy/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chartConfig = searchParams.get("c");

  if (!chartConfig) {
    return NextResponse.json({ error: "Missing chart configuration" }, { status: 400 });
  }

  // Panggil QuickChart dari sisi server (Server bebas dari batasan CORS Browser)
  const quickChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(chartConfig)}&w=600&h=350`;

  try {
    const res = await fetch(quickChartUrl);
    if (!res.ok) throw new Error("Gagal mengambil grafik dari QuickChart");

    const blob = await res.blob();
    
    // Kembalikan sebagai stream gambar PNG murni ke client
    return new NextResponse(blob.stream(), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error pada Chart Proxy:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}