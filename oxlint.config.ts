import { defineConfig } from "oxlint";

export default defineConfig({
  env: {
    node: true,
  },
  plugins: ["typescript"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/ban-types": "off",
  },
});
