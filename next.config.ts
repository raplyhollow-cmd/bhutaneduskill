import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No serverExternalPackages needed - we use Neon PostgreSQL (not native modules)
};

export default nextConfig;
