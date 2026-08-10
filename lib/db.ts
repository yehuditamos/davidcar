import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!client) {
    const url = process.env.DATABASE_URL || process.env.STORAGE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("Database connection is not configured");
    client = neon(url);
  }
  return client;
}
