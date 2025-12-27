// ============================================================================
// 🧪 PITCHCONNECT VITEST CONFIGURATION
// ============================================================================
// Modern testing framework for Next.js 15 + React 19 + TypeScript
// Migrated from Jest with all features preserved
// ============================================================================

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // ===========================================================================
  // 🔌 PLUGINS
  // ===========================================================================

  plugins: [
    // React plugin for JSX transformation
    react(),

    // Resolve TypeScript path aliases from tsconfig.json
    tsconfigPaths(),
  ],

  // ===========================================================================
  // 🧪 TEST CONFIGURATION
  // ===========================================================================

  test: {
    // =========================================================================
    // 🌍 ENVIRONMENT
    // =========================================================================

    // Use jsdom for DOM testing (simulates browser environment)
    environment: 'jsdom',

    // Enable global test APIs (describe, it, expect, vi, etc.)
    // No need to import from 'vitest' in every test file
    globals: true,

    // =========================================================================
    // 📁 TEST FILES
    // =========================================================================

    // Root directories to search for tests
    root: '.',

    // Include patterns for test files
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      '**/*.d.ts',
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/e2e/**',
    ],

    // =========================================================================
    // ⚙️ SETUP FILES
    // =========================================================================

    // Setup files run before each test file
    setupFiles: ['./tests/setup.ts'],

    // =========================================================================
    // 📍 PATH RESOLUTION (Aliases)
    // =========================================================================

    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
      '@/components/': new URL('./src/components/', import.meta.url).pathname,
      '@/lib/': new URL('./src/lib/', import.meta.url).pathname,
      '@/hooks/': new URL('./src/hooks/', import.meta.url).pathname,
      '@/utils/': new URL('./src/utils/', import.meta.url).pathname,
      '@/types/': new URL('./src/types/', import.meta.url).pathname,
      '@/styles/': new URL('./src/styles/', import.meta.url).pathname,
      '@/app/': new URL('./src/app/', import.meta.url).pathname,
      '@/contexts/': new URL('./src/contexts/', import.meta.url).pathname,
      '@/services/': new URL('./src/services/', import.meta.url).pathname,
      '@/stores/': new URL('./src/stores/', import.meta.url).pathname,
    },

    // =========================================================================
    // 📊 COVERAGE CONFIGURATION
    // =========================================================================

    coverage: {
      // Coverage provider (v8 is faster, istanbul has more features)
      provider: 'v8',

      // Enable coverage reporting
      enabled: false, // Enable with --coverage flag

      // Report formats
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov', 'clover'],

      // Output directory
      reportsDirectory: './coverage',

      // Files to include in coverage
      include: ['src/**/*.{js,jsx,ts,tsx}'],

      // Files to exclude from coverage
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/stories/**',
        '**/*.stories.{js,jsx,ts,tsx}',
        '**/index.ts',
        '**/index.tsx',
        'src/types/**',
        'src/app/api/**', // API routes often harder to unit test
        'src/middleware.ts',
      ],

      // Fail tests if coverage falls below thresholds
      thresholds: {
        // Global thresholds
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Per-directory thresholds (stricter for critical code)
        'src/lib/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/hooks/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/utils/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },

      // Clean coverage folder before running tests
      clean: true,

      // Skip files with no executable code
      skipFull: false,

      // Watermarks for coverage (yellow/red thresholds)
      watermarks: {
        statements: [70, 80],
        functions: [70, 80],
        branches: [70, 80],
        lines: [70, 80],
      },
    },

    // =========================================================================
    // 📋 REPORTERS
    // =========================================================================

    reporters: [
      // Default console reporter
      'default',

      // HTML reporter for detailed results
      'html',

      // JSON reporter for CI integration
      'json',

      // JUnit XML reporter (for CI systems like Jenkins, GitLab CI)
      [
        'junit',
        {
          outputFile: './test-results/junit.xml',
          suiteName: 'PitchConnect Tests',
          classname: '{filepath}',
        },
      ],
    ],

    // Output file for JSON reporter
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
    },

    // =========================================================================
    // ⏱️ TIMEOUTS & PERFORMANCE
    // =========================================================================

    // Test timeout in milliseconds
    testTimeout: 10000,

    // Hook timeout (beforeAll, afterAll, etc.)
    hookTimeout: 30000,

    // Teardown timeout
    teardownTimeout: 10000,

    // Number of concurrent tests
    // Set to 1 for integration tests that need isolation
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },

    // =========================================================================
    // 🔄 WATCH MODE
    // =========================================================================

    // Watch mode (disabled by default, use --watch flag)
    watch: false,

    // Files to watch for changes
    watchExclude: ['node_modules', 'dist', '.next', 'coverage'],

    // Re-run tests when these files change
    forceRerunTriggers: [
      '**/vitest.config.*',
      '**/vite.config.*',
      '**/tests/setup.ts',
    ],

    // =========================================================================
    // 🎯 OTHER OPTIONS
    // =========================================================================

    // Retry failed tests
    retry: 0,

    // Fail fast - stop on first failure
    bail: 0, // Set to 1 to stop on first failure

    // Allow console.log in tests
    silent: false,

    // CSS handling
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },

    // Mock reset behavior
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Snapshot settings
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },

    // Update snapshots (use with -u flag)
    // update: false,

    // Diff options for failed assertions
    diff: {
      truncateThreshold: 50,
    },

    // Type checking (experimental)
    typecheck: {
      enabled: false, // Enable with --typecheck flag
      checker: 'tsc',
      include: ['src/**/*.{ts,tsx}'],
    },

    // Sequence options
    sequence: {
      // Shuffle test order to catch hidden dependencies
      shuffle: false,
      // Seed for shuffling (for reproducibility)
      // seed: 1234,
    },

    // Deps optimization
    deps: {
      optimizer: {
        web: {
          include: [],
        },
      },
    },

    // Server configuration
    server: {
      deps: {
        inline: [
          // Inline packages that don't work well with ESM
          /msw/,
          /@mswjs/,
        ],
      },
    },
  },

  // ===========================================================================
  // 🔧 RESOLVE CONFIGURATION
  // ===========================================================================

  resolve: {
    alias: {
      '@': '/src',
    },
  },

  // ===========================================================================
  // 📦 ESBuild OPTIONS
  // ===========================================================================

  esbuild: {
    // JSX configuration for React
    jsxInject: `import React from 'react'`,
  },
});