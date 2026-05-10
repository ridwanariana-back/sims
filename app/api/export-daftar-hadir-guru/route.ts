import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // 1. Query untuk Kehadiran Guru
    const resGuru = await sql`
      SELECT 
        g.nama as nama_guru, 
        g.nip, 
        kg.tanggal, 
        kg.status, 
        kg.keterangan
      FROM kehadiran_guru kg
      JOIN guru g ON kg.guru_id = g.id
      ORDER BY kg.tanggal DESC, g.nama ASC
    `;

    // --- PROSES PEMBUATAN EXCEL ---
    
    // Buat Workbook baru
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Kehadiran Guru
    const sheetGuru = XLSX.utils.json_to_sheet(resGuru.rows);
    XLSX.utils.book_append_sheet(workbook, sheetGuru, "Hadir Guru");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Rekap_Kehadiran_Guru_SMAN1_Pemulutan_Selatan.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Gagal export data kehadiran" }, { status: 500 });
  }
}