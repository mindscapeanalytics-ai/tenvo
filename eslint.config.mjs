import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    // Override default ignores of eslint-config-next and add project ignores.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        // Ignore migration/utility scripts that intentionally use CommonJS / mixed module types.
        "scripts/**"
    ]),
    // Project-specific rule overrides for files that should be treated differently:
    {
        // Disable explicit-any errors for the central types file while we iteratively fix types.
        files: ["types/index.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off"
        }
    }
]);

export default eslintConfig;
