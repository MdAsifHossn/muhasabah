import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Downgrade overly strict React-hooks rules to warnings only.
  // "set-state-in-effect" fires on the common and correct pattern of resetting
  // derived state when a prop becomes null inside an effect. The "refs" rule
  // disallows reading refs during render, but that is the documented React
  // pattern for getDerivedStateFromProps-style updates without an extra render.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
