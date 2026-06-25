import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
