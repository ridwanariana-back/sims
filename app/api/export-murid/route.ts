import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Ambil data guru + status wali kelas
    const res = await sql`
      SELECT nisn,nama,gender as jenis_kelamin,tanggal_lahir,nik,nama_ibu,kelas,rombel,status
      FROM murid
      ORDER BY nama ASC
    `;
    
    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(res.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Murid");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Data_Murid_SMAN1_Pemulutan_Selatan.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal export" }, { status: 500 });
  }
}