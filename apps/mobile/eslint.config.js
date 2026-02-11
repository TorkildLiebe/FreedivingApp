// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          "@/components/*",
          "@/hooks/*",
          "@/contexts/*",
          "@/services/*",
          "@/constants/*",
          "@/types/*"
        ]
      }]
    }
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          "@/app/*"
        ]
      }]
    }
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          "@/src/features/*",
          "@/app/*"
        ]
      }]
    }
  },
  {
    files: ["src/infrastructure/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          "@/src/features/*",
          "@/app/*"
        ]
      }]
    }
  },
  {
    files: ["src/features/auth/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          "@/src/features/map/*"
        ]
      }]
    }
  },
  {
    files: ["src/features/map/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          "@/src/features/auth/*"
        ]
      }]
    }
  },
  {
    files: [
      "**/__tests__/**/*.[jt]s?(x)",
      "**/*.{test,spec}.[jt]s?(x)"
    ],
    languageOptions: {
      globals: {
        afterAll: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
        jest: "readonly"
      }
    }
  }
]);
