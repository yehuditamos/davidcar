import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, section, title, hint, options
      FROM questions
      WHERE active = true
      ORDER BY sort_order
    `;
    return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json([], { status: 503 });
  }
}
