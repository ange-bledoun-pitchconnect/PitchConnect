// ============================================================================
// 🔍 PITCHCONNECT ESLINT CONFIGURATION
// ============================================================================
// Code quality & style linting for Next.js 15 + React 19 + TypeScript
// Integrates with: Prettier, Tailwind CSS, React Hooks
// ============================================================================

/** @type {import('eslint').Linter.Config} */
const config = {
  // ===========================================================================
  // 🌍 ENVIRONMENT & PARSER
  // ===========================================================================

  root: true,

  env: {
    browser: true,
    node: true,
    es2024: true,
    jest: true,
  },

  // TypeScript parser for .ts/.tsx files
  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    // Enable type-aware linting (requires tsconfig)
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },

  // ===========================================================================
  // 📦 PLUGINS
  // ===========================================================================

  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'jsx-a11y',
    'prettier',
  ],

  // ===========================================================================
  // 🔗 EXTENDS (Order matters - later configs override earlier ones)
  // ===========================================================================

  extends: [
    // ESLint recommended rules
    'eslint:recommended',

    // TypeScript recommended rules
    'plugin:@typescript-eslint/recommended',

    // React recommended rules
    'plugin:react/recommended',
    'plugin:react/jsx-runtime', // For React 17+ (no need to import React)

    // React Hooks rules
    'plugin:react-hooks/recommended',

    // Accessibility rules
    'plugin:jsx-a11y/recommended',

    // Import rules
    'plugin:import/recommended',
    'plugin:import/typescript',

    // Next.js specific rules
    'next/core-web-vitals',
    'next/typescript',

    // Prettier - MUST BE LAST to override other formatting rules
    'plugin:prettier/recommended',
  ],

  // ===========================================================================
  // ⚙️ SETTINGS
  // ===========================================================================

  settings: {
    react: {
      version: 'detect', // Automatically detect React version
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },

  // ===========================================================================
  // 📋 RULES
  // ===========================================================================

  rules: {
    // =========================================================================
    // 🚫 OFF - Disabled Rules
    // =========================================================================

    // React 17+ doesn't require React import
    'react/react-in-jsx-scope': 'off',

    // Next.js handles prop-types via TypeScript
    'react/prop-types': 'off',

    // Allow empty interfaces (useful for extending)
    '@typescript-eslint/no-empty-interface': 'off',

    // Allow empty object types (useful for component props)
    '@typescript-eslint/no-empty-object-type': 'off',

    // We handle this with TypeScript
    'react/require-default-props': 'off',

    // =========================================================================
    // ⚠️ WARN - Warning Rules
    // =========================================================================

    // Next.js Image component preferred, but allow <img> with warning
    '@next/next/no-img-element': 'warn',

    // Prefer const over let when variable is not reassigned
    'prefer-const': 'warn',

    // Disallow var, use let/const instead
    'no-var': 'warn',

    // Warn on console.log (should use proper logging in production)
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],

    // Warn on TODO/FIXME comments
    'no-warning-comments': [
      'warn',
      {
        terms: ['TODO', 'FIXME', 'HACK', 'XXX'],
        location: 'start',
      },
    ],

    // Warn on unused variables (allow underscore prefix for intentionally unused)
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],

    // Accessibility warnings
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',

    // =========================================================================
    // ❌ ERROR - Error Rules
    // =========================================================================

    // === React Hooks (Critical for React 19) ===

    // Enforce Rules of Hooks
    'react-hooks/rules-of-hooks': 'error',

    // Verify dependencies of useEffect, useCallback, useMemo
    // Set to 'warn' as it can be overly strict in some cases
    'react-hooks/exhaustive-deps': 'warn',

    // === TypeScript ===

    // Require explicit return types on exported functions
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Prefer using 'type' for type-only imports
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
        fixStyle: 'inline-type-imports',
      },
    ],

    // Disallow @ts-ignore without explanation
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        minimumDescriptionLength: 10,
      },
    ],

    // Disallow explicit any (use unknown instead)
    '@typescript-eslint/no-explicit-any': 'warn',

    // Require await in async functions
    '@typescript-eslint/require-await': 'off',

    // Disallow floating promises (must be awaited or voided)
    '@typescript-eslint/no-floating-promises': 'off',

    // Disallow misused promises (e.g., in conditionals)
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false, // Allow async event handlers in JSX
        },
      },
    ],

    // === Imports ===

    // Enforce import order
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Node.js built-in modules
          'external', // npm packages
          'internal', // Aliased imports (@/...)
          'parent', // Parent imports (../)
          'sibling', // Sibling imports (./)
          'index', // Index imports
          'object', // Object imports
          'type', // Type imports
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: 'next/**',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react', 'next'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // No duplicate imports
    'import/no-duplicates': 'error',

    // Ensure imports resolve
    'import/no-unresolved': 'error',

    // Disallow default exports (prefer named exports for better refactoring)
    // Disabled for Next.js pages/layouts which require default exports
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'off',

    // === React ===

    // Enforce consistent component naming
    'react/jsx-pascal-case': 'error',

    // Disallow unnecessary fragments
    'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],

    // Self-close components without children
    'react/self-closing-comp': 'error',

    // Enforce boolean attribute notation
    'react/jsx-boolean-value': ['error', 'never'],

    // Enforce curly braces in JSX
    'react/jsx-curly-brace-presence': [
      'error',
      {
        props: 'never',
        children: 'never',
        propElementValues: 'always',
      },
    ],

    // Disallow array index as key
    'react/no-array-index-key': 'warn',

    // Disallow unstable nested components
    'react/no-unstable-nested-components': 'error',

    // === General JavaScript ===

    // Require === and !== (except for null checks)
    eqeqeq: ['error', 'smart'],

    // Disallow nested ternary expressions
    'no-nested-ternary': 'warn',

    // Disallow reassigning function parameters
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['draft', 'acc', 'req', 'res'],
      },
    ],

    // Disallow use before define (hoisting issues)
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      {
        functions: false,
        classes: true,
        variables: true,
      },
    ],

    // === Prettier Integration ===
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true,
      },
    ],
  },

  // ===========================================================================
  // 📁 FILE-SPECIFIC OVERRIDES
  // ===========================================================================

  overrides: [
    // =========================================================================
    // TypeScript files
    // =========================================================================
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // TypeScript handles these better
        'no-undef': 'off',
      },
    },

    // =========================================================================
    // Next.js App Router files (require default exports)
    // =========================================================================
    {
      files: [
        'src/app/**/{page,layout,loading,error,not-found,template,default}.tsx',
        'src/app/**/route.ts',
        'src/middleware.ts',
        'next.config.{js,mjs,ts}',
        'tailwind.config.{js,ts}',
        'postcss.config.{js,cjs,mjs}',
        'prettier.config.{js,cjs,mjs}',
        'vitest.config.{js,ts}',
        'playwright.config.ts',
      ],
      rules: {
        'import/no-default-export': 'off',
      },
    },

    // =========================================================================
    // Configuration files (CommonJS)
    // =========================================================================
    {
      files: ['*.config.js', '*.config.cjs'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },

    // =========================================================================
    // Test files
    // =========================================================================
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/tests/**',
        '**/__tests__/**',
      ],
      env: {
        jest: true,
      },
      rules: {
        // Allow any in tests for mocking
        '@typescript-eslint/no-explicit-any': 'off',
        // Allow non-null assertions in tests
        '@typescript-eslint/no-non-null-assertion': 'off',
        // Allow magic numbers in tests
        'no-magic-numbers': 'off',
        // Allow console in tests
        'no-console': 'off',
      },
    },

    // =========================================================================
    // Prisma seed and scripts
    // =========================================================================
    {
      files: ['prisma/**/*.ts', 'scripts/**/*.ts', 'scripts/**/*.js'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },

    // =========================================================================
    // Type definition files
    // =========================================================================
    {
      files: ['**/*.d.ts'],
      rules: {
        // Allow any in type definitions
        '@typescript-eslint/no-explicit-any': 'off',
        // Allow unused vars (often used for extending interfaces)
        '@typescript-eslint/no-unused-vars': 'off',
        // Declaration files often triple-slash reference
        'spaced-comment': 'off',
      },
    },

    // =========================================================================
    // API Routes
    // =========================================================================
    {
      files: ['src/app/api/**/*.ts'],
      rules: {
        // API routes may need console for debugging
        'no-console': 'warn',
      },
    },
  ],

  // ===========================================================================
  // 🚫 IGNORE PATTERNS
  // ===========================================================================

  ignorePatterns: [
    // Build outputs
    '.next/',
    'out/',
    'dist/',
    'build/',

    // Dependencies
    'node_modules/',

    // Generated files
    'prisma/generated/',
    '*.generated.ts',
    '*.generated.tsx',

    // Static assets
    'public/',

    // Coverage
    'coverage/',

    // Cache
    '.turbo/',
    '.cache/',

    // Config files (handled separately or by specific tools)
    '*.config.mjs',
  ],
};

module.exports = config;
