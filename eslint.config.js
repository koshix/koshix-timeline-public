import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "blob-report/**",
    ],
  },

  {
    files: [
      "src/**/*.js",
      "src/**/*.jsx",
    ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },

      globals: {
        ...globals.browser,
        __APP_VERSION__: "readonly",
        __APP_UPDATED_DATE__: "readonly",
      },
    },

    rules: {
      "no-undef": "error",
    },
  },

  {
    files: [
      "scripts/**/*.mjs",
      "vite.config.js",
      "playwright.config.js",
      "tests/e2e/**/*.js",
    ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-undef": "error",
    },
  },
];
