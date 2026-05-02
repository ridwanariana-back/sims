import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { id, wali_kelas } = await req.json();
    await sql`
      UPDATE guru 
      SET wali_kelas = ${wali_kelas} 
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}