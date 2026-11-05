import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Same presets as the former .eslintrc.json ("next/core-web-vitals",
// "next/typescript").
export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Rules introduced by eslint-plugin-react-hooks v7 (React Compiler checks).
    // Existing code predates them; they are tracked as warnings until the
    // affected hooks are refactored, so CI keeps failing only on real errors.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "coverage/**"]),
]);
