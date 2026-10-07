import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // TEMPORARY (Phase 0): pre-existing, site-wide violations downgraded to warnings so that
  // `npm run check` can gate CI. Each one is tracked in docs/ROADMAP.md and goes back to "error"
  // once fixed (Phase 1: purity; Phase 2: memoization, explicit-any).
  {
    rules: {
      "react-hooks/preserve-manual-memoization": "warn", // 153 sites, page-client useMemo deps
      "@typescript-eslint/no-explicit-any": "warn", // 116 sites
      "react-hooks/purity": "warn", // 9 sites: Math.random during render (hydration mismatch)
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
