/**
 * ============================================================================
 * 🔧 PITCHCONNECT - PLAYWRIGHT GLOBAL SETUP
 * ============================================================================
 * Path: /tests/e2e/global-setup.ts
 *
 * Runs once before all tests to:
 * - Verify environment readiness
 * - Seed test database (if needed)
 * - Create authentication storage states for all user roles
 * - Set up test fixtures
 * ============================================================================
 */

import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ============================================================================
// 🔧 CONFIGURATION
// ============================================================================

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const AUTH_DIR = path.join(__dirname, '.auth');

/** Authentication file paths by role */
const AUTH_FILES = {
  user: path.join(AUTH_DIR, 'user.json'),
  admin: path.join(AUTH_DIR, 'admin.json'),
  coach: path.join(AUTH_DIR, 'coach.json'),
  player: path.join(AUTH_DIR, 'player.json'),
  referee: path.join(AUTH_DIR, 'referee.json'),
  guardian: path.join(AUTH_DIR, 'guardian.json'),
} as const;

/** Test user credentials (should match database seed) */
const TEST_USERS = {
  user: {
    email: process.env.E2E_USER_EMAIL || 'test@getpitchconnect.com',
    password: process.env.E2E_USER_PASSWORD || 'TestPassword123!',
    role: 'USER',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@getpitchconnect.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'AdminPassword123!',
    role: 'ADMIN',
  },
  coach: {
    email: process.env.E2E_COACH_EMAIL || 'coach@getpitchconnect.com',
    password: process.env.E2E_COACH_PASSWORD || 'CoachPassword123!',
    role: 'COACH',
  },
  player: {
    email: process.env.E2E_PLAYER_EMAIL || 'player@getpitchconnect.com',
    password: process.env.E2E_PLAYER_PASSWORD || 'PlayerPassword123!',
    role: 'PLAYER',
  },
  referee: {
    email: process.env.E2E_REFEREE_EMAIL || 'referee@getpitchconnect.com',
    password: process.env.E2E_REFEREE_PASSWORD || 'RefereePassword123!',
    role: 'REFEREE',
  },
  guardian: {
    email: process.env.E2E_GUARDIAN_EMAIL || 'guardian@getpitchconnect.com',
    password: process.env.E2E_GUARDIAN_PASSWORD || 'GuardianPassword123!',
    role: 'GUARDIAN',
  },
} as const;

type UserRole = keyof typeof TEST_USERS;

// ============================================================================
// 🛠️ HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure authentication directory exists
 */
function ensureAuthDirectory(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    console.log('📁 Created auth directory:', AUTH_DIR);
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url: string, timeout = 60000): Promise<boolean> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok || response.status < 500) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  
  return false;
}

/**
 * Authenticate a user and save storage state
 */
async function authenticateUser(
  role: UserRole,
  storageStatePath: string
): Promise<boolean> {
  const user = TEST_USERS[role];
  
  console.log(`🔐 Authenticating ${role} (${user.email})...`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to sign in page
    await page.goto(`${BASE_URL}/auth/signin`, { 
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for form to be ready
    await page.waitForSelector('input[name="email"], input[type="email"]', {
      state: 'visible',
      timeout: 10000,
    });

    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', user.email);
    await page.fill('input[name="password"], input[type="password"]', user.password);

    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ]);

    // Verify login success by checking URL or page content
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/auth/signin') && !currentUrl.includes('/auth/error');

    if (!isLoggedIn) {
      // Check for error messages
      const errorMessage = await page.textContent('[role="alert"], .error-message').catch(() => null);
      console.warn(`⚠️  Login may have failed for ${role}: ${errorMessage || 'No error message'}`);
    }

    // Save storage state regardless (for testing auth flows)
    await context.storageState({ path: storageStatePath });
    
    console.log(`✅ ${role} authentication saved`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to authenticate ${role}:`, error instanceof Error ? error.message : error);
    
    // Create empty storage state to prevent test setup failures
    await context.storageState({ path: storageStatePath });
    console.warn(`⚠️  Created empty storage state for ${role}`);
    return false;
    
  } finally {
    await browser.close();
  }
}

/**
 * Seed test database
 */
async function seedDatabase(): Promise<void> {
  if (process.env.SKIP_DB_SEED === 'true') {
    console.log('⏭️  Skipping database seed (SKIP_DB_SEED=true)');
    return;
  }

  console.log('🌱 Checking database seed...');

  try {
    const response = await fetch(`${BASE_URL}/api/test/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Secret': process.env.TEST_SECRET || 'pitchconnect-test-secret',
      },
      body: JSON.stringify({
        users: Object.values(TEST_USERS),
        clean: process.env.CLEAN_DB_SEED === 'true',
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Database seeded:', result.message || 'Success');
    } else if (response.status === 404) {
      console.log('ℹ️  No seed endpoint available, using existing data');
    } else {
      console.warn(`⚠️  Seed endpoint returned ${response.status}`);
    }
  } catch (error) {
    console.log('ℹ️  Could not reach seed endpoint, continuing with existing data');
  }
}

/**
 * Verify test environment health
 */
async function healthCheck(): Promise<void> {
  console.log('🏥 Running health checks...');

  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const health = await response.json();
      console.log('✅ Health check passed:', health.status || 'OK');
    } else {
      console.warn('⚠️  Health check returned:', response.status);
    }
  } catch {
    console.log('ℹ️  No health endpoint available');
  }
}

// ============================================================================
// 🚀 MAIN GLOBAL SETUP
// ============================================================================

async function globalSetup(config: FullConfig): Promise<void> {
  const startTime = Date.now();

  console.log('\n');
  console.log('═'.repeat(78));
  console.log('🎭 PITCHCONNECT E2E GLOBAL SETUP');
  console.log('═'.repeat(78));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📁 Test Dir: ${config.rootDir}`);
  console.log(`🖥️  Workers:  ${config.workers}`);
  console.log('');

  // Step 1: Ensure auth directory exists
  ensureAuthDirectory();

  // Step 2: Wait for server to be ready
  console.log('⏳ Waiting for server...');
  const serverReady = await waitForServer(BASE_URL);
  
  if (!serverReady) {
    console.error('❌ Server did not start in time');
    console.log('💡 Ensure the dev server is running: npm run dev');
    process.exit(1);
  }
  console.log('✅ Server is ready');

  // Step 3: Run health check
  await healthCheck();

  // Step 4: Seed database if needed
  await seedDatabase();

  // Step 5: Authenticate all user roles
  console.log('\n🔐 Setting up authentication states...\n');

  const authResults = await Promise.allSettled([
    authenticateUser('user', AUTH_FILES.user),
    authenticateUser('admin', AUTH_FILES.admin),
    authenticateUser('coach', AUTH_FILES.coach),
    authenticateUser('player', AUTH_FILES.player),
    authenticateUser('referee', AUTH_FILES.referee),
    authenticateUser('guardian', AUTH_FILES.guardian),
  ]);

  const successCount = authResults.filter(
    (r) => r.status === 'fulfilled' && r.value === true
  ).length;

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n');
  console.log('═'.repeat(78));
  console.log(`✅ GLOBAL SETUP COMPLETE (${elapsed}s)`);
  console.log(`🔐 Authenticated: ${successCount}/${authResults.length} roles`);
  console.log('═'.repeat(78));
  console.log('\n');
}

export default globalSetup;