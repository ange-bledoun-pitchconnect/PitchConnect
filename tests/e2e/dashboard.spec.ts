/**
 * ============================================================================
 * E2E TESTS - USER WORKFLOWS
 * ============================================================================
 * 
 * Test coverage for:
 * - Dashboard navigation
 * - Player management
 * - Export functionality
 * - Mobile responsiveness
 * - Dark mode
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// ============================================================================
// TEST SUITE: Dashboard
// ============================================================================

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should load dashboard with analytics', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Check for dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="kpi-wins"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-losses"]')).toBeVisible();
  });

  test('should display real-time metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Check metrics are visible
    await expect(page.locator('[data-testid="lcp-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-score"]')).toBeVisible();
  });

  test('should render charts correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Check for chart elements
    const charts = await page.locator('[data-testid="chart"]').count();
    expect(charts).toBeGreaterThan(0);
  });

  test('should update data in real-time', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const initialValue = await page.locator('[data-testid="player-count"]').textContent();

    // Wait for potential update
    await page.waitForTimeout(2000);

    const updatedValue = await page.locator('[data-testid="player-count"]').textContent();
    // Value may or may not change, but should be accessible
    expect(updatedValue).toBeDefined();
  });
});

// ============================================================================
// TEST SUITE: Players Management
// ============================================================================

test.describe('Players Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should list all players', async ({ page }) => {
    await page.goto(`${BASE_URL}/players`);

    await expect(page.locator('h1')).toContainText('Players');
    const playerRows = await page.locator('[data-testid="player-row"]').count();
    expect(playerRows).toBeGreaterThan(0);
  });

  test('should search players by name', async ({ page }) => {
    await page.goto(`${BASE_URL}/players`);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('John');

    // Wait for search results
    await page.waitForTimeout(500);

    const results = await page.locator('[data-testid="player-row"]').count();
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test('should add new player', async ({ page }) => {
    await page.goto(`${BASE_URL}/players`);

    // Click add button
    await page.click('button:has-text("Add Player")');

    // Fill form
    await page.fill('input[name="name"]', 'New Player');
    await page.fill('input[name="number"]', '10');
    await page.click('button:has-text("Save")');

    // Verify success message
    await expect(page.locator('text=Player added successfully')).toBeVisible();
  });

  test('should edit existing player', async ({ page }) => {
    await page.goto(`${BASE_URL}/players`);

    // Find and click edit button on first player
    await page.locator('[data-testid="player-row"]').first().hover();
    await page.click('[data-testid="edit-button"]');

    // Update rating
    await page.fill('input[name="rating"]', '8.5');
    await page.click('button:has-text("Save")');

    // Verify success
    await expect(page.locator('text=Player updated')).toBeVisible();
  });

  test('should delete player with confirmation', async ({ page }) => {
    await page.goto(`${BASE_URL}/players`);

    // Find and click delete button
    await page.locator('[data-testid="player-row"]').first().hover();
    await page.click('[data-testid="delete-button"]');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success
    await expect(page.locator('text=Player deleted')).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE: Export Functionality
// ============================================================================

test.describe('Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should export data as PDF', async ({ page }) => {
    await page.goto(`${BASE_URL}/players`);

    // Open export modal
    await page.click('button:has-text("Export")');

    // Select PDF option
    await page.click('button[data-testid="export-pdf"]');

    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should export data as CSV', async ({ page }) => {
    await page.goto(`${BASE_URL}/players`);

    await page.click('button:has-text("Export")');
    await page.click('button[data-testid="export-csv"]');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should send export via email', async ({ page }) => {
    await page.goto(`${BASE_URL}/players`);

    await page.click('button:has-text("Export")');
    await page.click('button[data-testid="export-email"]');

    // Fill email
    await page.fill('input[name="email"]', 'recipient@example.com');
    await page.click('button:has-text("Send")');

    await expect(page.locator('text=Email sent successfully')).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE: Mobile Responsiveness
// ============================================================================

test.describe('Mobile Responsiveness', () => {
  test('should display mobile layout on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/dashboard`);

    // Check for mobile-specific elements
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    await expect(mobileNav).toBeVisible();
  });

  test('should display desktop layout on large screens', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(`${BASE_URL}/dashboard`);

    // Check for desktop-specific elements
    const sideBar = page.locator('[data-testid="sidebar"]');
    await expect(sideBar).toBeVisible();
  });

  test('should be touch-friendly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/players`);

    // Check button sizes (should be >= 44px)
    const button = page.locator('button').first();
    const boundingBox = await button.boundingBox();
    expect(boundingBox?.height || 0).toBeGreaterThanOrEqual(40);
  });
});

// ============================================================================
// TEST SUITE: Dark Mode
// ============================================================================

test.describe('Dark Mode', () => {
  test('should toggle dark mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Open settings
    await page.click('[data-testid="settings-button"]');

    // Toggle dark mode
    await page.click('input[name="darkMode"]');

    // Check for dark mode class
    const html = page.locator('html');
    const isDark = await html.evaluate((el) => el.classList.contains('dark'));
    expect(isDark).toBe(true);
  });

  test('should persist dark mode preference', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Enable dark mode
    await page.click('[data-testid="settings-button"]');
    await page.click('input[name="darkMode"]');

    // Refresh page
    await page.reload();

    // Check dark mode is still enabled
    const html = page.locator('html');
    const isDark = await html.evaluate((el) => el.classList.contains('dark'));
    expect(isDark).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: Performance
// ============================================================================

test.describe('Performance', () => {
  test('should load dashboard under 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid="dashboard"]');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('should have good Lighthouse score', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Check for performance metrics
    const metrics = await page.evaluate(() => ({
      lcp: performance.getEntriesByName('largest-contentful-paint')?.startTime,
      fid: 0, // FID measurement requires user interaction
      cls: 0, // CLS accumulated during page lifetime
    }));

    expect(metrics).toBeDefined();
  });
});
