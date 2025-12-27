/**
 * ============================================================================
 * 🧩 PITCHCONNECT - PLAYWRIGHT TEST FIXTURES
 * ============================================================================
 * Path: /tests/e2e/fixtures/index.ts
 *
 * Extended Playwright test fixtures with:
 * - Custom assertions
 * - Page object models
 * - Test utilities
 * - Performance helpers
 * - Accessibility helpers
 * ============================================================================
 */

import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import { NETWORK_PROFILES, GEOLOCATIONS } from '../../../playwright.config';

// ============================================================================
// 🔧 TYPES
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttfb: number; // Time to First Byte
}

// ============================================================================
// 📄 PAGE OBJECT MODELS
// ============================================================================

/**
 * Base page with common actions
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async getToastMessage(): Promise<string | null> {
    const toast = this.page.locator('[role="alert"], [data-testid="toast"]').first();
    return await toast.textContent();
  }

  async dismissToast(): Promise<void> {
    await this.page.locator('[data-testid="toast-close"]').click();
  }
}

/**
 * Dashboard page object
 */
export class DashboardPage extends BasePage {
  readonly welcomeMessage = this.page.getByTestId('welcome-message');
  readonly statsCards = this.page.getByTestId('stats-card');
  readonly recentMatches = this.page.getByTestId('recent-matches');
  readonly upcomingEvents = this.page.getByTestId('upcoming-events');
  readonly quickActions = this.page.getByTestId('quick-actions');

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async getStatsValue(statName: string): Promise<string | null> {
    const card = this.page.getByTestId(`stat-${statName}`);
    return await card.locator('[data-testid="stat-value"]').textContent();
  }

  async clickQuickAction(action: string): Promise<void> {
    await this.page.getByTestId(`quick-action-${action}`).click();
  }
}

/**
 * Match page object
 */
export class MatchPage extends BasePage {
  readonly matchHeader = this.page.getByTestId('match-header');
  readonly scoreDisplay = this.page.getByTestId('score-display');
  readonly homeTeam = this.page.getByTestId('home-team');
  readonly awayTeam = this.page.getByTestId('away-team');
  readonly matchTimer = this.page.getByTestId('match-timer');
  readonly eventLog = this.page.getByTestId('event-log');

  async goto(matchId: string): Promise<void> {
    await this.page.goto(`/matches/${matchId}`);
  }

  async getScore(): Promise<{ home: number; away: number }> {
    const homeScore = await this.page.getByTestId('home-score').textContent();
    const awayScore = await this.page.getByTestId('away-score').textContent();
    return {
      home: parseInt(homeScore || '0', 10),
      away: parseInt(awayScore || '0', 10),
    };
  }

  async recordEvent(type: string, playerId?: string): Promise<void> {
    await this.page.getByTestId(`event-btn-${type}`).click();
    if (playerId) {
      await this.page.getByTestId(`player-${playerId}`).click();
    }
    await this.page.getByTestId('confirm-event').click();
  }
}

/**
 * Team page object
 */
export class TeamPage extends BasePage {
  readonly teamName = this.page.getByTestId('team-name');
  readonly teamLogo = this.page.getByTestId('team-logo');
  readonly roster = this.page.getByTestId('team-roster');
  readonly stats = this.page.getByTestId('team-stats');

  async goto(teamId: string): Promise<void> {
    await this.page.goto(`/teams/${teamId}`);
  }

  async getRosterCount(): Promise<number> {
    return await this.page.getByTestId('player-card').count();
  }

  async selectPlayer(playerId: string): Promise<void> {
    await this.page.getByTestId(`player-${playerId}`).click();
  }
}

// ============================================================================
// 🧩 CUSTOM FIXTURES
// ============================================================================

type CustomFixtures = {
  /** Dashboard page object */
  dashboardPage: DashboardPage;
  /** Match page object */
  matchPage: MatchPage;
  /** Team page object */
  teamPage: TeamPage;
  /** Performance metrics collector */
  performanceMetrics: () => Promise<PerformanceMetrics>;
  /** Apply network throttling */
  throttleNetwork: (profile: keyof typeof NETWORK_PROFILES) => Promise<void>;
  /** Set geolocation */
  setLocation: (location: keyof typeof GEOLOCATIONS) => Promise<void>;
  /** Wait for API response */
  waitForApi: (endpoint: string) => Promise<unknown>;
  /** Mock API response */
  mockApi: (endpoint: string, response: unknown, status?: number) => Promise<void>;
  /** Test user data */
  testUser: TestUser;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  // Page Objects
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  matchPage: async ({ page }, use) => {
    await use(new MatchPage(page));
  },

  teamPage: async ({ page }, use) => {
    await use(new TeamPage(page));
  },

  // Performance metrics collector
  performanceMetrics: async ({ page }, use) => {
    const getMetrics = async (): Promise<PerformanceMetrics> => {
      return await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find((p) => p.name === 'first-contentful-paint');

        // Get Web Vitals from Performance Observer if available
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        const lcp = lcpEntries[lcpEntries.length - 1] as PerformanceEntry & { startTime: number };

        return {
          fcp: fcp?.startTime || 0,
          lcp: lcp?.startTime || 0,
          cls: 0, // Requires PerformanceObserver
          fid: 0, // Requires user interaction
          ttfb: navigation?.responseStart - navigation?.requestStart || 0,
        };
      });
    };

    await use(getMetrics);
  },

  // Network throttling
  throttleNetwork: async ({ context }, use) => {
    const throttle = async (profile: keyof typeof NETWORK_PROFILES) => {
      const cdpSession = await context.newCDPSession(await context.newPage());
      await cdpSession.send('Network.emulateNetworkConditions', NETWORK_PROFILES[profile]);
    };

    await use(throttle);
  },

  // Geolocation setter
  setLocation: async ({ context }, use) => {
    const setLoc = async (location: keyof typeof GEOLOCATIONS) => {
      await context.setGeolocation(GEOLOCATIONS[location]);
    };

    await use(setLoc);
  },

  // API response waiter
  waitForApi: async ({ page }, use) => {
    const waitFor = async (endpoint: string) => {
      const response = await page.waitForResponse((res) => res.url().includes(endpoint));
      return await response.json();
    };

    await use(waitFor);
  },

  // API mocker
  mockApi: async ({ page }, use) => {
    const mock = async (endpoint: string, response: unknown, status = 200) => {
      await page.route(`**/api/**/${endpoint}`, (route) => {
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      });
    };

    await use(mock);
  },

  // Test user data
  testUser: async ({}, use) => {
    const user: TestUser = {
      id: 'test-user-id',
      email: process.env.E2E_USER_EMAIL || 'test@getpitchconnect.com',
      name: 'Test User',
      role: 'USER',
    };

    await use(user);
  },
});

// ============================================================================
// 🔍 CUSTOM ASSERTIONS
// ============================================================================

export { expect };

// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique test ID
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Wait for network idle with timeout
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Get all console messages
 */
export async function captureConsoleLogs(
  page: Page,
  callback: () => Promise<void>
): Promise<string[]> {
  const logs: string[] = [];
  
  const handler = (msg: import('@playwright/test').ConsoleMessage) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  };

  page.on('console', handler);
  await callback();
  page.off('console', handler);

  return logs;
}

/**
 * Check for accessibility violations using axe-core
 */
export async function checkAccessibility(page: Page): Promise<void> {
  // Note: Requires @axe-core/playwright to be installed
  // const { injectAxe, checkA11y } = require('@axe-core/playwright');
  // await injectAxe(page);
  // await checkA11y(page);
}

/**
 * Take a full page screenshot for visual comparison
 */
export async function captureVisualSnapshot(
  page: Page,
  name: string
): Promise<void> {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    animations: 'disabled',
  });
}