import { requireAdmin } from "../../../../lib/admin";
import { getDb } from "../../../../lib/db";

export const dynamic = "force-dynamic";

type Option = [string, string, number];

function validOptions(value: unknown): value is Option[] {
  return Array.isArray(value) && value.length === 4 && value.every(
    option => Array.isArray(option) && option.length === 3 &&
      typeof option[0] === "string" && typeof option[1] === "string" &&
      Number.isFinite(Number(option[2]))
  );
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const sql = getDb();
  const rows = await sql`
    SELECT id, section, title, hint, options, sort_order, active
    FROM questions ORDER BY sort_order
  `;
  return Response.json(rows);
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json();
  const sql = getDb();

  if (body.action === "reorder" && Array.isArray(body.ids)) {
    const ids = body.ids.map(String);
    for (let i = 0; i < ids.length; i++) {
      await sql`UPDATE questions SET sort_order = ${10000 + i} WHERE id = ${ids[i]}`;
    }
    for (let i = 0; i < ids.length; i++) {
      await sql`UPDATE questions SET sort_order = ${i + 1}, updated_at = now() WHERE id = ${ids[i]}`;
    }
    return Response.json({ ok: true });
  }

  if (body.action === "toggle") {
    await sql`UPDATE questions SET active = NOT active, updated_at = now() WHERE id = ${String(body.id)}`;
    return Response.json({ ok: true });
  }

  const section = String(body.section || "").trim();
  const title = String(body.title || "").trim();
  const hint = String(body.hint || "").trim();
  if (!section || !title || !validOptions(body.options)) {
    return Response.json({ error: "יש למלא שאלה וארבע תשובות" }, { status: 400 });
  }
  const options = JSON.stringify(body.options.map((o: Option) => [o[0], o[1].trim(), Number(o[2])]));
  if (body.id) {
    await sql`
      UPDATE questions SET section=${section}, title=${title}, hint=${hint},
      options=${options}::jsonb, updated_at=now() WHERE id=${String(body.id)}
    `;
  } else {
    const next = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 AS value FROM questions` as { value: number }[];
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await sql`
      INSERT INTO questions (id,section,title,hint,options,sort_order)
      VALUES (${id},${section},${title},${hint},${options}::jsonb,${Number(next[0].value)})
    `;
  }
  return Response.json({ ok: true });
}
