import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
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
