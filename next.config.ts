import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@clerk/nextjs/server", "drizzle-orm/better-sqlite3"],
};

export default nextConfig;
