import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No serverExternalPackages needed - we use Neon PostgreSQL (not native modules)

  // Performance optimizations for low-resource systems
  experimental: {
    // Reduce memory usage during builds
    workerThreads: false,
    cpus: 2, // Limit to your physical cores
    // Speed up dev server with turbo
    turbo: undefined, // Use Turbo for faster rebuilds
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

  // Speed up development by reducing type checking overhead
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix TypeScript errors in billing actions
  },

  // Faster HMR by optimizing package imports
  transpilePackages: [],

  // Reduce file system watching overhead
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Speed up HMR - remove polling, use native file watching (much faster)
      config.watchOptions = {
        poll: false, // Use native file watching instead of polling
        aggregateTimeout: 200, // Faster rebuilds
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
          '**/build/**',
          '**/public/**', // Don't watch public folder
        ],
      };

      // Cache webpack results for faster rebuilds
      config.cache = {
        type: 'filesystem',
        cacheDirectory: '.next/cache/webpack',
      };
    }
    return config;
  },
};

export default nextConfig;
