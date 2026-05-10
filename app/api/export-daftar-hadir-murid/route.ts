import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {

    // 2. Query untuk Kehadiran Murid
    const resMurid = await sql`
      SELECT 
        m.nama as nama_murid, 
        m.nisn, 
        m.rombel, 
        k.tanggal, 
        k.status, 
        k.keterangan
      FROM kehadiran k
      JOIN murid m ON k.murid_id = m.id
      ORDER BY k.tanggal DESC, m.nama ASC
    `;

    // --- PROSES PEMBUATAN EXCEL ---
    
    // Buat Workbook baru
    const workbook = XLSX.utils.book_new();

    // Sheet 2: Kehadiran Murid
    const sheetMurid = XLSX.utils.json_to_sheet(resMurid.rows);
    XLSX.utils.book_append_sheet(workbook, sheetMurid, "Hadir Murid");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Rekap_Kehadiran_Murid_SMAN1_Pemulutan_Selatan.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Gagal export data kehadiran" }, { status: 500 });
  }
}