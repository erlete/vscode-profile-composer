import js from "@eslint/js";
import globals from "globals";

export default [
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/compiled/**",
      "site/**", // Site has its own Next.js ESLint config
      "profiles-and-such~/**",
    ],
  },

  // Base configuration for all JavaScript/MJS files
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,

      // Strict mode and best practices
      strict: ["error", "never"], // ES modules have implicit strict mode
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "no-console": "off", // Allow console for scripts
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Code quality
      "no-undef": "error",
      "no-unreachable": "error",
      "no-duplicate-imports": "error",
      "no-template-curly-in-string": "warn",
      "require-atomic-updates": "error",

      // Best practices
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-return-await": "error",
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",

      // Code style consistency
      "array-callback-return": "error",
      "consistent-return": "warn",
      "default-case-last": "error",
      "dot-notation": "warn",
      "no-lonely-if": "warn",
      "no-useless-return": "warn",
      "object-shorthand": "warn",
      "prefer-destructuring": [
        "warn",
        {
          array: false,
          object: true,
        },
      ],
      "prefer-template": "warn",
      yoda: "error",

      // Modern JavaScript
      "no-useless-constructor": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
    },
  },

  // Specific configuration for compiler files
  {
    files: ["compiler/**/*.mjs", "scripts/**/*.mjs"],
    rules: {
      "no-console": "off", // Console is expected in scripts
    },
  },

  // Configuration for config files
  {
    files: ["*.config.mjs", "*.config.js"],
    rules: {
      "no-console": "off",
    },
  },
];
