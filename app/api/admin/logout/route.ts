import { cookies } from "next/headers";
import { ADMIN_COOKIE, hashValue } from "../../../../lib/admin";
import { getDb } from "../../../../lib/db";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    const sql = getDb();
    await sql`DELETE FROM admin_sessions WHERE token_hash = ${hashValue(token)}`;
  }
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  return response;
}
