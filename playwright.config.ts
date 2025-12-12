/**
 * ============================================================================
 * PLAYWRIGHT CONFIGURATION - E2E & SMOKE TESTING
 * ============================================================================
 * 
 * Complete Playwright setup for:
 * - End-to-end testing
 * - Cross-browser testing
 * - Mobile testing
 * - Performance testing
 * - Visual regression testing
 */

export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/junit-e2e.xml' }],
    ['github'],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Maximum time for each action */
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    // ====================================================================
    // DESKTOP BROWSERS
    // ====================================================================
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // ====================================================================
    // MOBILE BROWSERS
    // ====================================================================
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },

    // ====================================================================
    // SMOKE TESTS CONFIGURATION (Subset of tests)
    // ====================================================================
    {
      name: 'smoke-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.smoke\.spec\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Timeout configuration */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  /* Global timeout */
  globalTimeout: 30 * 60 * 1000,
});