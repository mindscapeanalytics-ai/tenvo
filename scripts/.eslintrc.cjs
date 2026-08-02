// scripts/.eslintrc.cjs
// This config is intentionally permissive for runtime/migration scripts
// that use CommonJS `require()` and mixed module types. It keeps other
// ESLint rules enabled while allowing require-style imports.

module.exports = {
  root: true,
  env: {
    node: true,
    es2024: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
  },
  overrides: [
    {
      files: ["**/scripts/**/*.js", "**/scripts/**/*.cjs", "**/scripts/**/*.mjs", "run-*.js", "scripts/**"],
      rules: {
        // Allow CommonJS require/imports in scripts
        "@typescript-eslint/no-require-imports": "off",
        // Keep other stylistic rules in case you want them enforced here
      },
    },
  ],
};
