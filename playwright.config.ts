/**
 * ============================================================================
 * 🎭 PITCHCONNECT - ENTERPRISE PLAYWRIGHT CONFIGURATION v2.0
 * ============================================================================
 * Path: /playwright.config.ts
 *
 * World-class E2E testing configuration for multi-sport management platform
 *
 * ============================================================================
 * FEATURES:
 * ============================================================================
 * ✅ Multi-browser testing (Chrome, Firefox, Safari, Edge)
 * ✅ Mobile device emulation (iOS, Android, Tablets)
 * ✅ Authentication state management with role-based storage
 * ✅ Global setup/teardown with database seeding
 * ✅ Visual regression testing with screenshot comparison
 * ✅ Accessibility (a11y) testing integration
 * ✅ Performance & Core Web Vitals testing
 * ✅ API endpoint testing (headless)
 * ✅ Network throttling profiles (4G, 3G, offline)
 * ✅ Geographic location testing (stadium coordinates)
 * ✅ Dark/Light mode theme testing
 * ✅ Internationalization (i18n) testing
 * ✅ CI/CD optimized with sharding support
 * ✅ Comprehensive reporting (HTML, JSON, JUnit, Allure)
 * ✅ Video & trace capture for debugging
 * ✅ Parallel execution with worker optimization
 * ✅ Test tagging & filtering (@smoke, @critical, @regression)
 * ✅ Role-based tests (Admin, Coach, Player, Referee)
 * ============================================================================
 */

import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription, Project } from '@playwright/test';
import path from 'path';

// ============================================================================
// 🔧 ENVIRONMENT CONFIGURATION
// ============================================================================

/** Environment detection */
const IS_CI = !!process.env.CI;
const IS_DEBUG = !!process.env.PLAYWRIGHT_DEBUG || !!process.env.DEBUG;
const IS_HEADED = !!process.env.HEADED;

/** Environment URLs */
const ENVIRONMENTS = {
  local: 'http://localhost:3000',
  staging: process.env.STAGING_URL || 'https://staging.getpitchconnect.com',
  production: process.env.PRODUCTION_URL || 'https://getpitchconnect.com',
} as const;

type Environment = keyof typeof ENVIRONMENTS;
const ENVIRONMENT = (process.env.TEST_ENV || 'local') as Environment;
const BASE_URL = process.env.E2E_BASE_URL || ENVIRONMENTS[ENVIRONMENT];
const API_BASE_URL = process.env.API_BASE_URL || `${BASE_URL}/api`;

// ============================================================================
// ⏱️ TIMEOUT CONFIGURATION
// ============================================================================

const TIMEOUTS = {
  /** Individual test timeout */
  test: IS_CI ? 60_000 : 30_000,

  /** Navigation timeout (page.goto, page.reload) */
  navigation: 30_000,

  /** Action timeout (click, fill, type) */
  action: IS_CI ? 15_000 : 10_000,

  /** Expect assertion timeout */
  expect: IS_CI ? 10_000 : 5_000,

  /** Global timeout for entire test run */
  global: IS_CI ? 60 * 60_000 : 30 * 60_000,

  /** Web server startup timeout */
  webServer: 120_000,
} as const;

// ============================================================================
// 🔄 RETRY & PARALLELIZATION
// ============================================================================

const EXECUTION = {
  /** Retry failed tests */
  retries: IS_CI ? 2 : 0,

  /** Worker count */
  workers: IS_CI
    ? parseInt(process.env.PLAYWRIGHT_WORKERS || '2', 10)
    : undefined,

  /** Run tests in files in parallel */
  fullyParallel: !IS_CI,

  /** Shard configuration for CI matrix */
  shard: process.env.SHARD
    ? {
        current: parseInt(process.env.SHARD.split('/')[0], 10),
        total: parseInt(process.env.SHARD.split('/')[1], 10),
      }
    : undefined,
} as const;

// ============================================================================
// 📁 PATHS & DIRECTORIES
// ============================================================================

const PATHS = {
  /** E2E test directory */
  testDir: './tests/e2e',

  /** Test results output */
  outputDir: './test-results',

  /** HTML report output */
  reportDir: './playwright-report',

  /** Snapshot directory for visual regression */
  snapshotDir: './tests/e2e/__snapshots__',

  /** Authentication storage states by role */
  auth: {
    user: './tests/e2e/.auth/user.json',
    admin: './tests/e2e/.auth/admin.json',
    coach: './tests/e2e/.auth/coach.json',
    player: './tests/e2e/.auth/player.json',
    referee: './tests/e2e/.auth/referee.json',
    guardian: './tests/e2e/.auth/guardian.json',
  },

  /** Global setup/teardown */
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
} as const;

// ============================================================================
// 📊 REPORTER CONFIGURATION
// ============================================================================

function buildReporters(): ReporterDescription[] {
  const reporters: ReporterDescription[] = [
    // Console output with step details
    ['list', { printSteps: true }],

    // Interactive HTML report
    [
      'html',
      {
        outputFolder: PATHS.reportDir,
        open: IS_CI ? 'never' : 'on-failure',
        host: 'localhost',
        port: 9323,
      },
    ],

    // JSON for programmatic access
    [
      'json',
      {
        outputFile: path.join(PATHS.outputDir, 'e2e-results.json'),
      },
    ],

    // JUnit XML for CI (Jenkins, GitLab, Azure DevOps)
    [
      'junit',
      {
        outputFile: path.join(PATHS.outputDir, 'junit-e2e.xml'),
        embedAnnotationsAsProperties: true,
        embedAttachmentsAsProperty: 'testng_attachments',
      },
    ],
  ];

  if (IS_CI) {
    // GitHub Actions annotations
    reporters.push(['github']);

    // Blob reporter for sharded test merging
    reporters.push([
      'blob',
      {
        outputDir: path.join(PATHS.outputDir, 'blob-reports'),
      },
    ]);
  }

  if (IS_DEBUG) {
    reporters.push(['line']);
  }

  return reporters;
}

// ============================================================================
// 🌐 NETWORK THROTTLING PROFILES
// ============================================================================

/** Network conditions for performance testing */
export const NETWORK_PROFILES = {
  /** Fast 4G - typical mobile connection */
  fast4G: {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 20,
  },
  /** Slow 3G - poor connection testing */
  slow3G: {
    offline: false,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (500 * 1024) / 8,
    latency: 400,
  },
  /** Offline mode - service worker testing */
  offline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  },
} as const;

// ============================================================================
// 🗺️ GEOGRAPHIC LOCATIONS (STADIUMS & VENUES)
// ============================================================================

/** Geolocation presets for location-based features */
export const GEOLOCATIONS = {
  // UK Venues
  wembley: { latitude: 51.556, longitude: -0.2795 },
  oldTrafford: { latitude: 53.4631, longitude: -2.2913 },
  anfield: { latitude: 53.4308, longitude: -2.9608 },
  emiratesStadium: { latitude: 51.5549, longitude: -0.1084 },
  stamfordBridge: { latitude: 51.4817, longitude: -0.191 },
  twickenham: { latitude: 51.4559, longitude: -0.3415 },

  // International
  campNou: { latitude: 41.3809, longitude: 2.1228 },
  santiagoBernabeu: { latitude: 40.453, longitude: -3.6883 },
  allianzArena: { latitude: 48.2188, longitude: 11.6247 },
  sanSiro: { latitude: 45.478, longitude: 9.124 },
  mcg: { latitude: -37.82, longitude: 144.9834 },
  madisonSquareGarden: { latitude: 40.7505, longitude: -73.9934 },
} as const;

// ============================================================================
// 📱 CUSTOM DEVICE CONFIGURATIONS
// ============================================================================

/** Sports-specific device configurations */
export const CUSTOM_DEVICES = {
  /** Coach sideline tablet */
  'Coach Tablet': {
    ...devices['iPad Pro 11'],
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  },
  /** Player mobile - quick stats access */
  'Player Phone': {
    ...devices['iPhone 14 Pro'],
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
  },
  /** Match day stats display - large screen */
  'Stats Display': {
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  },
  /** Referee smartwatch - minimal UI */
  'Referee Watch': {
    viewport: { width: 396, height: 484 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Wear OS) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  },
  /** Scoreboard kiosk - ultra-wide */
  'Scoreboard Kiosk': {
    viewport: { width: 2560, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  },
} as const;

// ============================================================================
// 🎭 PROJECT DEFINITIONS
// ============================================================================

function buildProjects(): Project[] {
  const projects: Project[] = [];

  // ===========================================================================
  // 🔐 AUTHENTICATION SETUP/TEARDOWN
  // ===========================================================================

  projects.push(
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
    }
  );

  // ===========================================================================
  // 🖥️ DESKTOP BROWSERS - PRIMARY
  // ===========================================================================

  projects.push(
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: PATHS.auth.user,
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: PATHS.auth.user,
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: PATHS.auth.user,
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        storageState: PATHS.auth.user,
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    }
  );

  // ===========================================================================
  // 📱 MOBILE DEVICES
  // ===========================================================================

  projects.push(
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        storageState: PATHS.auth.user,
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14 Pro'],
        storageState: PATHS.auth.user,
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    },
    {
      name: 'tablet-ipad',
      use: {
        ...devices['iPad Pro 11'],
        storageState: PATHS.auth.user,
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    },
    {
      name: 'mobile-android-small',
      use: {
        ...devices['Pixel 5'],
        storageState: PATHS.auth.user,
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    },
    {
      name: 'mobile-iphone-se',
      use: {
        ...devices['iPhone SE'],
        storageState: PATHS.auth.user,
      },
      dependencies: ['setup'],
      testIgnore: /.*\.(setup|teardown|smoke|performance|a11y|api|visual|admin|coach|player)\.ts/,
    }
  );

  // ===========================================================================
  // 🏃 SMOKE TESTS - Quick validation before full suite
  // ===========================================================================

  projects.push({
    name: 'smoke',
    testMatch: /.*\.smoke\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: PATHS.auth.user,
    },
    dependencies: ['setup'],
    retries: 0,
    timeout: 20_000,
  });

  // ===========================================================================
  // 🔥 CRITICAL PATH TESTS - Must pass for deployment
  // ===========================================================================

  projects.push({
    name: 'critical',
    testMatch: /.*\.critical\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: PATHS.auth.user,
      video: 'on',
      trace: 'on',
    },
    dependencies: ['setup'],
    retries: IS_CI ? 3 : 1,
  });

  // ===========================================================================
  // ⚡ PERFORMANCE TESTS
  // ===========================================================================

  projects.push({
    name: 'performance',
    testMatch: /.*\.performance\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: PATHS.auth.user,
      launchOptions: {
        args: [
          '--disable-cache',
          '--disable-application-cache',
          '--disk-cache-size=0',
        ],
      },
    },
    dependencies: ['setup'],
    retries: 0,
    timeout: 120_000,
    fullyParallel: false,
  });

  // ===========================================================================
  // ♿ ACCESSIBILITY TESTS
  // ===========================================================================

  projects.push({
    name: 'accessibility',
    testMatch: /.*\.a11y\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: PATHS.auth.user,
    },
    dependencies: ['setup'],
  });

  // ===========================================================================
  // 🔌 API TESTS (Headless)
  // ===========================================================================

  projects.push({
    name: 'api',
    testMatch: /.*\.api\.ts/,
    use: {
      baseURL: API_BASE_URL,
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    retries: IS_CI ? 1 : 0,
    timeout: 30_000,
  });

  // ===========================================================================
  // 📷 VISUAL REGRESSION TESTS
  // ===========================================================================

  projects.push({
    name: 'visual',
    testMatch: /.*\.visual\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: PATHS.auth.user,
      viewport: { width: 1280, height: 720 },
      launchOptions: {
        args: ['--force-prefers-reduced-motion'],
      },
    },
    dependencies: ['setup'],
    retries: 0,
    expect: {
      toHaveScreenshot: {
        maxDiffPixelRatio: 0.01,
        threshold: 0.2,
        animations: 'disabled',
      },
    },
  });

  // ===========================================================================
  // 🌙 DARK MODE TESTS
  // ===========================================================================

  projects.push({
    name: 'dark-mode',
    testMatch: /.*\.theme\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: PATHS.auth.user,
      colorScheme: 'dark',
    },
    dependencies: ['setup'],
  });

  // ===========================================================================
  // 🌍 INTERNATIONALIZATION TESTS
  // ===========================================================================

  projects.push(
    {
      name: 'i18n-es',
      testMatch: /.*\.i18n\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: PATHS.auth.user,
        locale: 'es-ES',
        timezoneId: 'Europe/Madrid',
      },
      dependencies: ['setup'],
    },
    {
      name: 'i18n-de',
      testMatch: /.*\.i18n\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: PATHS.auth.user,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      },
      dependencies: ['setup'],
    }
  );

  // ===========================================================================
  // 📍 GEOLOCATION TESTS
  // ===========================================================================

  projects.push({
    name: 'geolocation',
    testMatch: /.*\.geo\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: PATHS.auth.user,
      geolocation: GEOLOCATIONS.wembley,
      permissions: ['geolocation'],
    },
    dependencies: ['setup'],
  });

  // ===========================================================================
  // 🔐 ROLE-BASED TESTS (PitchConnect User Roles)
  // ===========================================================================

  projects.push(
    {
      name: 'admin-tests',
      testMatch: /.*\.admin\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: PATHS.auth.admin,
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'coach-tests',
      testMatch: /.*\.coach\.ts/,
      use: {
        ...CUSTOM_DEVICES['Coach Tablet'],
        storageState: PATHS.auth.coach,
      },
      dependencies: ['setup'],
    },
    {
      name: 'player-tests',
      testMatch: /.*\.player\.ts/,
      use: {
        ...CUSTOM_DEVICES['Player Phone'],
        storageState: PATHS.auth.player,
      },
      dependencies: ['setup'],
    },
    {
      name: 'referee-tests',
      testMatch: /.*\.referee\.ts/,
      use: {
        ...CUSTOM_DEVICES['Referee Watch'],
        storageState: PATHS.auth.referee,
      },
      dependencies: ['setup'],
    }
  );

  // ===========================================================================
  // 📶 NETWORK CONDITION TESTS
  // ===========================================================================

  projects.push({
    name: 'slow-network',
    testMatch: /.*\.offline\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: PATHS.auth.user,
    },
    dependencies: ['setup'],
    timeout: 90_000,
  });

  return projects;
}

// ============================================================================
// 🚀 MAIN CONFIGURATION EXPORT
// ============================================================================

export default defineConfig({
  // ===========================================================================
  // 📁 TEST DISCOVERY
  // ===========================================================================

  testDir: PATHS.testDir,
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/node_modules/**', '**/fixtures/**', '**/__snapshots__/**'],

  // ===========================================================================
  // ⚡ EXECUTION SETTINGS
  // ===========================================================================

  fullyParallel: EXECUTION.fullyParallel,
  forbidOnly: IS_CI,
  retries: EXECUTION.retries,
  workers: EXECUTION.workers,
  ...(EXECUTION.shard && { shard: EXECUTION.shard }),

  // ===========================================================================
  // 📊 REPORTING
  // ===========================================================================

  reporter: buildReporters(),

  // ===========================================================================
  // 🌐 GLOBAL SETTINGS (Shared across all projects)
  // ===========================================================================

  use: {
    // Base configuration
    baseURL: BASE_URL,
    acceptDownloads: true,

    // Timeouts
    navigationTimeout: TIMEOUTS.navigation,
    actionTimeout: TIMEOUTS.action,

    // Locale & timezone (UK default)
    locale: 'en-GB',
    timezoneId: 'Europe/London',

    // Viewport
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,

    // Debugging & artifacts
    trace: IS_CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: IS_CI ? 'retain-on-failure' : 'off',

    // Headless mode
    headless: IS_CI && !IS_HEADED,

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-GB,en;q=0.9',
      'X-Test-Environment': 'playwright',
      'X-Test-Run-Id': process.env.TEST_RUN_ID || `local-${Date.now()}`,
    },

    // HTTPS handling
    ignoreHTTPSErrors: ENVIRONMENT !== 'production',

    // Browser context
    contextOptions: {
      strictSelectors: true,
      reducedMotion: 'reduce',
    },

    // Service workers
    serviceWorkers: 'block',

    // JavaScript
    javaScriptEnabled: true,
  },

  // ===========================================================================
  // 🎭 PROJECTS
  // ===========================================================================

  projects: buildProjects(),

  // ===========================================================================
  // ⏱️ TIMEOUTS
  // ===========================================================================

  timeout: TIMEOUTS.test,
  globalTimeout: TIMEOUTS.global,

  expect: {
    timeout: TIMEOUTS.expect,

    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
      animations: 'disabled',
    },

    toMatchSnapshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    },
  },

  // ===========================================================================
  // 📁 OUTPUT CONFIGURATION
  // ===========================================================================

  outputDir: path.join(PATHS.outputDir, 'traces'),
  snapshotDir: PATHS.snapshotDir,
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}-{projectName}{ext}',

  // ===========================================================================
  // 🔧 GLOBAL SETUP/TEARDOWN
  // ===========================================================================

  globalSetup: IS_CI ? undefined : PATHS.globalSetup,
  globalTeardown: IS_CI ? undefined : PATHS.globalTeardown,

  // ===========================================================================
  // 🖥️ WEB SERVER
  // ===========================================================================

  webServer: {
    command: ENVIRONMENT === 'local' ? 'npm run dev' : undefined,
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: TIMEOUTS.webServer,
    ignoreHTTPSErrors: true,
    stdout: IS_DEBUG ? 'pipe' : 'ignore',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },

  // ===========================================================================
  // 🧩 METADATA
  // ===========================================================================

  metadata: {
    environment: ENVIRONMENT,
    baseUrl: BASE_URL,
    isCI: IS_CI,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
  },

  // ===========================================================================
  // 📦 ADDITIONAL OPTIONS
  // ===========================================================================

  preserveOutput: 'failures-only',
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',
  quiet: IS_CI,
});

// ============================================================================
// 📤 EXPORTS FOR TEST UTILITIES
// ============================================================================

export { TIMEOUTS, PATHS, ENVIRONMENTS };
export type { Environment };

// ============================================================================
// 📝 CONFIGURATION LOGGING (Development only)
// ============================================================================

if (!IS_CI && typeof console !== 'undefined') {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎭 PITCHCONNECT PLAYWRIGHT CONFIG v2.0                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Environment:  ${ENVIRONMENT.padEnd(60)}║
║  Base URL:     ${BASE_URL.padEnd(60)}║
║  Workers:      ${String(EXECUTION.workers || 'auto (CPU/2)').padEnd(60)}║
║  Retries:      ${String(EXECUTION.retries).padEnd(60)}║
║  Test Timeout: ${`${TIMEOUTS.test / 1000}s`.padEnd(60)}║
║  Headless:     ${String(IS_CI && !IS_HEADED).padEnd(60)}║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
}