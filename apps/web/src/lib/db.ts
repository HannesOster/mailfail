import { createDb } from "@mailfail/db";

export const db = createDb(process.env.DATABASE_URL!);
