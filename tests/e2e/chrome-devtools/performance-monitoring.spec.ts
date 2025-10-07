/**
 * Chrome DevTools MCP Performance Monitoring Tests
 *
 * These tests demonstrate the conditional use of Chrome DevTools MCP capabilities
 * for enhanced performance testing of the LX Notes application.
 *
 * To enable Chrome DevTools MCP features, set ENABLE_CHROME_DEVTOOLS_MCP=true
 * in your environment or use the .env.test configuration.
 */

import { test, expect } from '@playwright/test';
import { createChromeDevToolsHelpers, withChromeDevTools } from '../../utils/chrome-devtools-helpers';

test.describe('Performance Monitoring with Chrome DevTools MCP', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the application to be ready
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 });
  });

  test('should measure Core Web Vitals for dashboard load', async ({ page }) => {
    const cdtHelpers = createChromeDevToolsHelpers(page);

    // Start performance monitoring
    await cdtHelpers.startPerformanceTrace();

    // Navigate to each module to measure performance
    const modules = ['cue-notes', 'work-notes', 'production-notes'];
    const results: any[] = [];

    for (const module of modules) {
      // Navigate to module
      await page.goto(`/${module}`);
      await page.waitForLoadState('networkidle');

      // Wait for module to be fully loaded
      await page.waitForSelector(`[data-testid="${module}-module"]`, { timeout: 5000 });

      // Get performance metrics for this module
      const metrics = await cdtHelpers.stopPerformanceTrace();
      results.push({ module, metrics });

      // Restart monitoring for next module
      await cdtHelpers.startPerformanceTrace();
    }

    // Generate comprehensive test report
    const report = await cdtHelpers.generateTestReport();

    // Assertions for performance thresholds
    for (const result of results) {
      console.log(`Performance metrics for ${result.module}:`, result.metrics);

      // Assert performance thresholds (when metrics are available)
      if (result.metrics.fcp) {
        expect(result.metrics.fcp).toBeLessThan(2000); // FCP < 2s
      }

      if (result.metrics.lcp) {
        expect(result.metrics.lcp).toBeLessThan(4000); // LCP < 4s
      }

      if (result.metrics.ttfb) {
        expect(result.metrics.ttfb).toBeLessThan(1000); // TTFB < 1s
      }
    }

    // Check for performance-related console errors
    expect(report.errors.filter(error =>
      error.includes('performance') ||
      error.includes('slow') ||
      error.includes('timeout')
    )).toHaveLength(0);

    console.log('Performance test completed successfully');
  });

  test('should monitor network requests during CSV import', async ({ page }) => {
    const cdtHelpers = createChromeDevToolsHelpers(page);

    // Navigate to work notes for CSV import testing
    await page.goto('/work-notes');

    // Start network monitoring
    await cdtHelpers.getNetworkRequests();

    // Simulate CSV import (if available)
    const importButton = page.locator('[data-testid="import-csv-button"]');
    if (await importButton.isVisible()) {
      await importButton.click();

      // Wait for import dialog
      await page.waitForSelector('[data-testid="import-dialog"]', { timeout: 5000 });

      // Monitor network activity during import simulation
      await page.waitForTimeout(2000); // Allow time for network requests

      // Get network analysis
      const networkRequests = await cdtHelpers.getNetworkRequests();

      // Analyze network performance
      const apiRequests = networkRequests.filter(req =>
        req.url.includes('/api/') || req.type === 'fetch'
      );

      console.log(`Captured ${networkRequests.length} total requests, ${apiRequests.length} API requests`);

      // Assert no failed requests
      const failedRequests = networkRequests.filter(req => req.status >= 400);
      expect(failedRequests).toHaveLength(0);

      // Assert reasonable response times (when available)
      const slowRequests = networkRequests.filter(req => req.duration > 5000);
      expect(slowRequests.length).toBeLessThan(networkRequests.length * 0.1); // < 10% slow requests
    } else {
      console.log('CSV import functionality not available, skipping network monitoring test');
    }
  });

  test('should detect JavaScript errors during note operations', async ({ page }) => {
    const cdtHelpers = createChromeDevToolsHelpers(page);

    // Start console monitoring
    await cdtHelpers.getConsoleMessages();

    // Navigate to cue notes
    await page.goto('/cue-notes');

    // Simulate note operations
    const addNoteButton = page.locator('[data-testid="add-note-button"]');
    if (await addNoteButton.isVisible()) {
      await addNoteButton.click();

      // Fill out note form
      await page.fill('[data-testid="note-title"]', 'Test Performance Note');
      await page.selectOption('[data-testid="note-priority"]', 'high');

      // Save note
      await page.click('[data-testid="save-note-button"]');

      // Wait for operation to complete
      await page.waitForTimeout(1000);

      // Check for JavaScript errors
      const report = await cdtHelpers.generateTestReport();

      // Assert no JavaScript errors occurred
      expect(report.errors).toHaveLength(0);

      // Check for warnings that might indicate issues
      const warnings = report.console.filter(msg => msg.level === 'warn');
      expect(warnings.length).toBeLessThan(5); // Allow some warnings but not excessive

      console.log(`Console monitoring captured ${report.console.length} messages, ${report.errors.length} errors`);
    } else {
      console.log('Add note functionality not available, skipping error detection test');
    }
  });

  test('should validate responsive design with device emulation', async ({ page }) => {
    const cdtHelpers = createChromeDevToolsHelpers(page);

    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 812, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);

      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate to dashboard
      await page.goto('/');

      // Take enhanced screenshot for visual regression
      await cdtHelpers.takeEnhancedScreenshot({
        filename: `tests/screenshots/responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true
      });

      // Verify layout elements are visible and properly sized
      const sidebar = page.locator('[data-testid="sidebar"]');
      const mainContent = page.locator('[data-testid="main-content"]');

      // Mobile-specific checks
      if (viewport.width < 768) {
        // On mobile, sidebar might be collapsed or hidden
        console.log('Validating mobile layout');
      } else {
        // On desktop/tablet, both sidebar and main content should be visible
        await expect(sidebar).toBeVisible();
        await expect(mainContent).toBeVisible();
      }

      // Verify no horizontal scrolling on any viewport
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    }

    console.log('Responsive design validation completed');
  });

  test('should measure page load performance across all modules', async ({ page }) => {
    const cdtHelpers = createChromeDevToolsHelpers(page);

    const modules = [
      { path: '/', name: 'Dashboard' },
      { path: '/cue-notes', name: 'Cue Notes' },
      { path: '/work-notes', name: 'Work Notes' },
      { path: '/production-notes', name: 'Production Notes' }
    ];

    const performanceResults: any[] = [];

    for (const module of modules) {
      console.log(`Measuring performance for ${module.name}`);

      // Start performance monitoring
      await cdtHelpers.startPerformanceTrace();

      // Navigate to module
      const startTime = Date.now();
      await page.goto(module.path);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Get detailed performance metrics
      const metrics = await cdtHelpers.stopPerformanceTrace();

      performanceResults.push({
        module: module.name,
        path: module.path,
        loadTime,
        metrics
      });

      // Assert basic load time threshold
      expect(loadTime).toBeLessThan(10000); // Page load < 10s
    }

    // Generate summary report
    const report = await cdtHelpers.generateTestReport();

    // Log performance summary
    console.log('Performance Summary:');
    performanceResults.forEach(result => {
      console.log(`  ${result.module}: ${result.loadTime}ms load time`);
      if (result.metrics.fcp) {
        console.log(`    FCP: ${result.metrics.fcp}ms`);
      }
      if (result.metrics.lcp) {
        console.log(`    LCP: ${result.metrics.lcp}ms`);
      }
    });

    // Verify no performance-related errors
    expect(report.errors).toHaveLength(0);
  });
});