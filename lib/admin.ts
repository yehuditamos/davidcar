import { createHash } from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export const ADMIN_COOKIE = "david_admin";

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function isAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const sql = getDb();
  const rows = await sql`
    SELECT token_hash FROM admin_sessions
    WHERE token_hash = ${hashValue(token)} AND expires_at > now()
    LIMIT 1
  ` as { token_hash: string }[];
  return rows.length === 1;
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
