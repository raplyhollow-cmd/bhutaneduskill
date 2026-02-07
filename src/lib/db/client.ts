import { createClient } from "@libsql/client";

export const client = createClient(process.env.DATABASE_URL!);
