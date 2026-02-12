import { createClient } from "@libsql/client";

export const client = createClient({ url: process.env.DATABASE_URL! });
