import { createDb } from "@mailfail/db";

let _db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _db = createDb(process.env.DATABASE_URL);
  }
  return _db;
}

// Lazy proxy so existing `db.xxx` call-sites still work at runtime
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getDb() as any)[prop];
  },
});
