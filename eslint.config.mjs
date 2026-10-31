import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".next-dev/**",
      "out/**",
      "build/**",
      "coverage/**",
      ".wrangler/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["scripts/*.js", "optimize-images.js", "scratch.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      // These Node entry points use require, module.exports, and __dirname.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
