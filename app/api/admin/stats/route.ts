import { requireAdmin } from "../../../../lib/admin";
import { getDb } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const requestedDays = Number(searchParams.get("days") || 30);
  const days = [7,30,90].includes(requestedDays) ? requestedDays : 30;
  const sql = getDb();
  const [summary, daily] = await Promise.all([
    sql`
      SELECT event_name, COUNT(*)::int AS count, COUNT(DISTINCT session_id)::int AS people
      FROM usage_events
      WHERE created_at >= now() - (${days} * interval '1 day')
      GROUP BY event_name
    `,
    sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
             COUNT(DISTINCT session_id)::int AS people
      FROM usage_events
      WHERE event_name = 'app_open' AND created_at >= now() - (${days} * interval '1 day')
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at)
    `
  ]);
  return Response.json({ days, summary, daily });
}
