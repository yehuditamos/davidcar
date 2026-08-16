import { getDb } from "../../../lib/db";

const allowed = new Set([
  "app_open","check_started","vehicle_details_completed","section_completed",
  "check_completed","phone_consultation_clicked","report_shared",
  "report_printed","another_vehicle_started",
  "vehicle_lookup_succeeded","vehicle_lookup_failed"
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = String(body.eventName || "");
    const sessionId = String(body.sessionId || "");
    if (!allowed.has(eventName) || !/^[a-zA-Z0-9-]{8,80}$/.test(sessionId)) {
      return Response.json({ ok: false }, { status: 400 });
    }
    const sql = getDb();
    await sql`INSERT INTO usage_events (event_name, session_id) VALUES (${eventName}, ${sessionId})`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
