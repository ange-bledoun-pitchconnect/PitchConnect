/**
 * ============================================================================
 * JEST CONFIGURATION - PRODUCTION GRADE
 * ============================================================================
 * 
 * Complete Jest setup for:
 * - Unit tests
 * - Integration tests
 * - Component testing
 * - Coverage reporting
 * - Next.js compatibility
 */

const nextJest = require('next/jest');

/**
 * Provide the path to your Next.js app to load next.config.js and .env files
 */
const createJestConfig = nextJest({
  dir: './',
});

/**
 * Custom Jest configuration
 */
const customJestConfig = {
  // Use jsdom test environment for React component tests
  testEnvironment: 'jest-environment-jsdom',

  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Module path aliases matching tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    'tests/**/*.[jt]s?(x)',
  ],

  // Files to ignore during testing
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/types/**',
    '!app/**/*.test.{js,jsx,ts,tsx}',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/hooks': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathAsClassName: true,
      },
    ],
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Bail on first failure in CI
  bail: process.env.CI ? 1 : 0,

  // Verbose output
  verbose: true,

  // Max workers for parallel testing
  maxWorkers: process.env.CI ? 2 : '50%',

  // Test timeout
  testTimeout: 10000,

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

/**
 * Export Jest configuration with Next.js support
 */
module.exports = createJestConfig(customJestConfig);