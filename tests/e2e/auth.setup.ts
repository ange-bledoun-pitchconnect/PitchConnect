/**
 * ============================================================================
 * 🔐 PITCHCONNECT - AUTHENTICATION SETUP
 * ============================================================================
 * Path: /tests/e2e/auth.setup.ts
 *
 * Playwright project that sets up authenticated storage states
 * This runs as part of the 'setup' project before other tests
 * ============================================================================
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

// ============================================================================
// 🔧 CONFIGURATION
// ============================================================================

const AUTH_DIR = path.join(__dirname, '.auth');

/** Test user credentials */
const TEST_USERS = {
  user: {
    email: process.env.E2E_USER_EMAIL || 'test@getpitchconnect.com',
    password: process.env.E2E_USER_PASSWORD || 'TestPassword123!',
    storageState: path.join(AUTH_DIR, 'user.json'),
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@getpitchconnect.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'AdminPassword123!',
    storageState: path.join(AUTH_DIR, 'admin.json'),
  },
  coach: {
    email: process.env.E2E_COACH_EMAIL || 'coach@getpitchconnect.com',
    password: process.env.E2E_COACH_PASSWORD || 'CoachPassword123!',
    storageState: path.join(AUTH_DIR, 'coach.json'),
  },
  player: {
    email: process.env.E2E_PLAYER_EMAIL || 'player@getpitchconnect.com',
    password: process.env.E2E_PLAYER_PASSWORD || 'PlayerPassword123!',
    storageState: path.join(AUTH_DIR, 'player.json'),
  },
  referee: {
    email: process.env.E2E_REFEREE_EMAIL || 'referee@getpitchconnect.com',
    password: process.env.E2E_REFEREE_PASSWORD || 'RefereePassword123!',
    storageState: path.join(AUTH_DIR, 'referee.json'),
  },
  guardian: {
    email: process.env.E2E_GUARDIAN_EMAIL || 'guardian@getpitchconnect.com',
    password: process.env.E2E_GUARDIAN_PASSWORD || 'GuardianPassword123!',
    storageState: path.join(AUTH_DIR, 'guardian.json'),
  },
} as const;

// ============================================================================
// 🔐 AUTHENTICATION HELPER
// ============================================================================

async function authenticate(
  page: import('@playwright/test').Page,
  email: string,
  password: string
): Promise<void> {
  // Navigate to sign in page
  await page.goto('/auth/signin');

  // Wait for form to be ready
  await page.waitForSelector('input[type="email"], input[name="email"]', {
    state: 'visible',
  });

  // Fill credentials
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect (successful login redirects away from auth pages)
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'), {
    timeout: 15000,
  });

  // Verify we're logged in
  await expect(page).not.toHaveURL(/\/auth\/(signin|error)/);
}

// ============================================================================
// 🧪 AUTHENTICATION SETUP TESTS
// ============================================================================

setup.describe('Authentication Setup', () => {
  setup('authenticate as user', async ({ page }) => {
    const { email, password, storageState } = TEST_USERS.user;

    await authenticate(page, email, password);

    // Save storage state
    await page.context().storageState({ path: storageState });
  });

  setup('authenticate as admin', async ({ page }) => {
    const { email, password, storageState } = TEST_USERS.admin;

    await authenticate(page, email, password);

    // Verify admin access (check for admin-specific UI element)
    // await expect(page.getByTestId('admin-panel-link')).toBeVisible();

    await page.context().storageState({ path: storageState });
  });

  setup('authenticate as coach', async ({ page }) => {
    const { email, password, storageState } = TEST_USERS.coach;

    await authenticate(page, email, password);

    await page.context().storageState({ path: storageState });
  });

  setup('authenticate as player', async ({ page }) => {
    const { email, password, storageState } = TEST_USERS.player;

    await authenticate(page, email, password);

    await page.context().storageState({ path: storageState });
  });

  setup('authenticate as referee', async ({ page }) => {
    const { email, password, storageState } = TEST_USERS.referee;

    await authenticate(page, email, password);

    await page.context().storageState({ path: storageState });
  });

  setup('authenticate as guardian', async ({ page }) => {
    const { email, password, storageState } = TEST_USERS.guardian;

    await authenticate(page, email, password);

    await page.context().storageState({ path: storageState });
  });
});