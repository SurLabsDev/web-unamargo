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
    // Los worktrees que arma Claude Code para trabajar en paralelo viven
    // adentro del repo, cada uno con su propio build: sin esto el lint de la
    // raiz revisa esas copias y da cientos de errores que no son del codigo.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
