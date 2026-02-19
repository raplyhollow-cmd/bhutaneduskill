/** @type {import('eslint').Linter.Config[]} */
const nextConfig = {
  extends: ["next/core-web-vitals", "next/typescript"],
};

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
    ],
  },
  // Note: Next.js ESLint config uses legacy .eslintrc format
  // We use minimal flat config here to avoid conflicts
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
