import { randomBytes } from "crypto";
import { getDb } from "../../../../lib/db";
import { ADMIN_COOKIE, hashValue } from "../../../../lib/admin";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const sql = getDb();
    const rows = await sql`SELECT pin_hash FROM admin_credentials WHERE id = 1` as { pin_hash: string }[];
    if (!rows.length || hashValue(String(pin || "").trim().toLowerCase()) !== rows[0].pin_hash) {
      return Response.json({ error: "קוד שגוי" }, { status: 401 });
    }
    const token = randomBytes(32).toString("hex");
    await sql`DELETE FROM admin_sessions WHERE expires_at <= now()`;
    await sql`
      INSERT INTO admin_sessions (token_hash, expires_at)
      VALUES (${hashValue(token)}, now() + interval '30 days')
    `;
    const response = Response.json({ ok: true });
    response.headers.append("Set-Cookie", `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
    return response;
  } catch {
    return Response.json({ error: "לא ניתן להתחבר כרגע" }, { status: 500 });
  }
}
