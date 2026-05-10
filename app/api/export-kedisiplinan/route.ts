import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Ambil data guru + status wali kelas
    const res = await sql`SELECT m.nama, m.rombel, ck.kategori, 
    ck.keterangan, ck.tanggal, g.nama as nama_wali, g.nip as nip_wali 
    FROM catatan_kedisiplinan ck 
    JOIN murid m ON ck.murid_id = m.id 
    LEFT JOIN wali_kelas wk ON m.rombel = wk.rombel 
    LEFT JOIN guru g ON wk.guru_id = g.id 
    ORDER BY ck.created_at DESC`;
    
    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(res.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kedisiplinan");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Data_Kedisiplinan_SMAN1_Pemulutan_Selatan.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal export" }, { status: 500 });
  }
}