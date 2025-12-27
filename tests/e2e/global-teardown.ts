/**
 * ============================================================================
 * 🧹 PITCHCONNECT - PLAYWRIGHT GLOBAL TEARDOWN
 * ============================================================================
 * Path: /tests/e2e/global-teardown.ts
 *
 * Runs once after all tests to:
 * - Clean up test data from database
 * - Remove authentication storage files
 * - Generate test run summary
 * - Report metrics to monitoring
 * ============================================================================
 */

import type { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ============================================================================
// 🔧 CONFIGURATION
// ============================================================================

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const AUTH_DIR = path.join(__dirname, '.auth');
const KEEP_AUTH_FILES = process.env.KEEP_AUTH_FILES === 'true';
const KEEP_TEST_DATA = process.env.KEEP_TEST_DATA === 'true';

// ============================================================================
// 🛠️ HELPER FUNCTIONS
// ============================================================================

/**
 * Clean up authentication storage files
 */
function cleanupAuthFiles(): void {
  if (KEEP_AUTH_FILES) {
    console.log('⏭️  Keeping auth files (KEEP_AUTH_FILES=true)');
    return;
  }

  if (!fs.existsSync(AUTH_DIR)) {
    return;
  }

  console.log('🧹 Cleaning up authentication files...');

  try {
    const files = fs.readdirSync(AUTH_DIR);
    let removedCount = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(AUTH_DIR, file));
        removedCount++;
      }
    }

    console.log(`   ✓ Removed ${removedCount} auth files`);

    // Remove directory if empty
    const remaining = fs.readdirSync(AUTH_DIR);
    if (remaining.length === 0) {
      fs.rmdirSync(AUTH_DIR);
      console.log('   ✓ Removed .auth directory');
    }
  } catch (error) {
    console.warn('   ⚠️  Could not clean auth files:', error instanceof Error ? error.message : error);
  }
}

/**
 * Clean up test data from database
 */
async function cleanupTestData(): Promise<void> {
  if (KEEP_TEST_DATA) {
    console.log('⏭️  Keeping test data (KEEP_TEST_DATA=true)');
    return;
  }

  console.log('🗑️  Cleaning up test data...');

  try {
    const response = await fetch(`${BASE_URL}/api/test/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Secret': process.env.TEST_SECRET || 'pitchconnect-test-secret',
      },
      body: JSON.stringify({
        // Specify what to clean up
        cleanUsers: false, // Keep test users for faster subsequent runs
        cleanMatches: true,
        cleanEvents: true,
        cleanNotifications: true,
        cleanAuditLog: true,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('   ✓ Test data cleaned:', result.message || 'Success');
    } else if (response.status === 404) {
      console.log('   ℹ️  No cleanup endpoint available');
    } else {
      console.warn(`   ⚠️  Cleanup returned ${response.status}`);
    }
  } catch {
    console.log('   ℹ️  Could not reach cleanup endpoint');
  }
}

/**
 * Report test metrics (optional)
 */
async function reportMetrics(): Promise<void> {
  if (!process.env.METRICS_ENDPOINT) {
    return;
  }

  console.log('📊 Reporting test metrics...');

  try {
    await fetch(process.env.METRICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.METRICS_TOKEN || ''}`,
      },
      body: JSON.stringify({
        type: 'e2e_test_run',
        environment: process.env.TEST_ENV || 'local',
        timestamp: new Date().toISOString(),
        ci: !!process.env.CI,
        commitSha: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA,
        branch: process.env.GITHUB_REF_NAME || process.env.CI_BRANCH,
      }),
      signal: AbortSignal.timeout(5000),
    });

    console.log('   ✓ Metrics reported');
  } catch {
    console.log('   ℹ️  Could not report metrics');
  }
}

/**
 * Generate test run summary
 */
function generateSummary(startTime: number): void {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n');
  console.log('═'.repeat(78));
  console.log('📊 TEST RUN SUMMARY');
  console.log('═'.repeat(78));
  console.log(`   Timestamp:    ${new Date().toISOString()}`);
  console.log(`   Environment:  ${process.env.TEST_ENV || 'local'}`);
  console.log(`   Base URL:     ${BASE_URL}`);
  console.log(`   CI:           ${process.env.CI ? 'Yes' : 'No'}`);
  console.log(`   Duration:     ${elapsed}s`);
  
  if (process.env.CI) {
    console.log(`   Commit:       ${process.env.GITHUB_SHA?.slice(0, 8) || 'N/A'}`);
    console.log(`   Branch:       ${process.env.GITHUB_REF_NAME || 'N/A'}`);
    console.log(`   Run ID:       ${process.env.GITHUB_RUN_ID || 'N/A'}`);
  }
  
  console.log('═'.repeat(78));
}

// ============================================================================
// 🚀 MAIN GLOBAL TEARDOWN
// ============================================================================

async function globalTeardown(config: FullConfig): Promise<void> {
  const startTime = Date.now();

  console.log('\n');
  console.log('═'.repeat(78));
  console.log('🎭 PITCHCONNECT E2E GLOBAL TEARDOWN');
  console.log('═'.repeat(78));
  console.log('');

  // Step 1: Clean up test data from database
  await cleanupTestData();

  // Step 2: Clean up authentication files
  cleanupAuthFiles();

  // Step 3: Report metrics to monitoring
  await reportMetrics();

  // Step 4: Generate summary
  generateSummary(startTime);

  console.log('\n✅ GLOBAL TEARDOWN COMPLETE\n');
}

export default globalTeardown;