import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Ambil data guru + status wali kelas
    const res = await sql`
      SELECT g.nama, g.nip, g.nuptk, g.nik, g.mapel, g.status, 
             wk.rombel as wali_kelas
      FROM guru g
      LEFT JOIN wali_kelas wk ON g.id = wk.guru_id
      ORDER BY g.nama ASC
    `;

    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(res.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Guru");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Data_Guru_SMAN1_Pemulutan_Selatan.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal export" }, { status: 500 });
  }
}