import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No serverExternalPackages needed - we use Neon PostgreSQL (not native modules)

  // Performance optimizations for low-resource systems
  experimental: {
    // Reduce memory usage during builds
    workerThreads: false,
    cpus: 2, // Limit to your physical cores
  },

  // Speed up builds by skipping source maps in development
  productionBrowserSourceMaps: false,

  // Optimize image handling
  images: {
    formats: ['image/webp'],
  },

  // Disable ESLint during builds (run separately with npm run lint)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript type checking during builds (run separately with npx tsc --noEmit)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
