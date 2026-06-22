import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * Flat ESLint config (ESLint 9). Replaces the deprecated `next lint` flow,
 * which is removed in Next.js 16. `eslint-config-next` still ships eslintrc-style
 * shareable configs, so we bridge them with FlatCompat.
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "node_modules/**",
      "coverage/**",
      "out/**",
      "next-env.d.ts",
      // design-sync (claude.ai/design) staged scripts, vendored bundle, and
      // build output. These are gitignored and not part of the app source.
      ".ds-sync/**",
      "ds-bundle/**",
      ".design-sync/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

export default eslintConfig;
