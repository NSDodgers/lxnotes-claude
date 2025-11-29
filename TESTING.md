# Testing Guide

This document provides comprehensive testing guidance for LX Notes, including Playwright E2E testing patterns, MCP browser automation, and best practices.

## Quick Reference

```bash
# Traditional Playwright Testing
npm run test:e2e                          # Run all E2E tests
npx playwright test --headed              # Run tests with visible browser
npx playwright test --ui                  # Interactive test runner
npx playwright show-report                # View test results

# Run specific tests
npx playwright test tests/e2e/work-notes.spec.ts
npx playwright test --grep "position order"

# Debug and update
npx playwright test --debug tests/e2e/position-order.spec.ts
npx playwright test --update-snapshots
```

## Test Architecture

The project follows a structured testing approach:
- **Tests Location**: `tests/e2e/` - Organized by feature modules
- **Test Utilities**: `tests/utils/test-helpers.ts` - Common testing patterns
- **Test Data**: `tests/fixtures/` - Mock data and selectors
- **Module Tests**: `cue-notes.spec.ts`, `work-notes.spec.ts`, `production-notes.spec.ts`

## Playwright E2E Testing

### Feature Development Workflow

```typescript
// Create feature-specific test file
// tests/e2e/lightwright/position-order.spec.ts

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Position Order Feature', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test('should import CSV with position order', async ({ page }) => {
    await helpers.navigateToModule('work-notes');

    // Test CSV upload
    const importButton = page.getByRole('button', { name: /import.*lightwright/i });
    await importButton.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('path/to/test.csv');

    // Verify import success
    await expect(page.getByText('successfully imported')).toBeVisible();
  });
});
```

### Visual Verification Workflow
- Use `page.screenshot()` for visual regression testing
- Capture before/after states for UI changes
- Store screenshots in `test-results/` for comparison

### Interactive Development
```bash
# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in UI mode (interactive debugging)
npx playwright test --ui

# Debug specific test
npx playwright test --debug tests/e2e/position-order.spec.ts
```

## Testing Patterns

### Using TestHelpers
The project provides standardized helpers for common operations:

```typescript
// Navigation
await helpers.navigateToModule('work-notes');
await helpers.waitForAppReady();

// Form interactions
await helpers.openDialog('[data-testid="add-note-button"]');
await helpers.fillNoteForm({
  title: 'Test Note',
  type: 'Work',
  priority: 'high'
});
await helpers.saveDialog();

// Verification
await helpers.expectNoteInTable('Test Note');
await helpers.expectPageTitle('Work Notes');
```

### Data-TestId Strategy
Use data-testid attributes for reliable element selection:
```html
<!-- Good: Stable identifier -->
<button data-testid="import-lightwright-button">Import</button>

<!-- Avoid: Fragile selectors -->
<button class="bg-blue-500 hover:bg-blue-600">Import</button>
```

### Wait Strategies
```typescript
// Wait for app hydration and store initialization
await helpers.waitForAppReady();

// Wait for specific elements
await page.waitForSelector('[data-testid="position-manager"]');

// Wait for network completion
await page.waitForLoadState('networkidle');

// Wait for custom conditions
await page.waitForFunction(() =>
  document.querySelector('[data-testid="fixtures-count"]')?.textContent?.includes('241')
);
```

## Common Testing Scenarios

### CSV Import Testing
```typescript
test('should handle CSV with position order column', async ({ page }) => {
  await helpers.navigateToModule('work-notes');

  // Upload CSV file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./tests/fixtures/lightwright-with-order.csv');

  // Verify position order is applied
  await page.goto('/positions');
  const positions = page.locator('[data-testid="position-item"]');

  // First position should be ordered correctly
  await expect(positions.first()).toContainText('SPOT BOOTH');

  // Check order source indicator
  await expect(page.getByText('From CSV')).toBeVisible();
});
```

### Drag-and-Drop Testing
```typescript
test('should allow reordering positions', async ({ page }) => {
  await page.goto('/positions');

  const positions = page.locator('[data-testid="position-item"]');
  const firstPos = positions.first();
  const secondPos = positions.nth(1);

  // Perform drag-and-drop
  await firstPos.dragTo(secondPos);

  // Verify order source changed
  await expect(page.getByText('Custom Order')).toBeVisible();
});
```

### Module-Specific Testing
```typescript
test('should sort work notes by position order', async ({ page }) => {
  await helpers.navigateToModule('work-notes');

  // Click position column header
  await page.getByRole('columnheader', { name: /position/i }).click();

  // Verify sorting applied
  const noteRows = page.locator('[data-testid="note-row"]');
  if (await noteRows.count() > 0) {
    const firstNote = noteRows.first();
    const positionCell = firstNote.locator('[data-testid="position-cell"]');
    await expect(positionCell).toBeVisible();
  }
});
```

### Error Handling Tests
```typescript
test('should handle CSV upload errors gracefully', async ({ page }) => {
  // Upload invalid CSV
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./tests/fixtures/invalid.csv');

  // Expect error message
  await expect(page.getByText(/error.*parsing/i)).toBeVisible();

  // Verify UI remains functional
  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
});
```

### Performance Testing
```typescript
test('should handle large CSV files efficiently', async ({ page }) => {
  const startTime = Date.now();

  // Upload large CSV
  await fileInput.setInputFiles('./tests/fixtures/large-lightwright.csv');

  // Wait for completion
  await page.waitForSelector('[data-testid="import-success"]');

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(10000); // Should complete within 10s
});
```

### Visual Regression Testing
```typescript
test('position manager visual consistency', async ({ page }) => {
  await page.goto('/positions');
  await helpers.waitForAppReady();

  // Take screenshot for visual comparison
  await expect(page).toHaveScreenshot('position-manager.png');
});
```

### Cross-Feature Testing
Test interactions between modules:
```typescript
test('position changes affect work notes sorting', async ({ page }) => {
  // 1. Modify position order
  await page.goto('/positions');
  // ... reorder positions

  // 2. Verify work notes reflect change
  await helpers.navigateToModule('work-notes');
  // ... verify sort order
});
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names that explain the behavior
- Follow AAA pattern: Arrange, Act, Assert

### 2. Stability
- Always use `waitForAppReady()` before interactions
- Prefer data-testid over fragile CSS selectors
- Handle loading states appropriately

### 3. Error Handling
- Test both success and failure paths
- Verify error messages are user-friendly
- Ensure UI remains functional after errors

### 4. Performance
- Set reasonable timeout expectations
- Test with realistic data volumes
- Monitor network activity for bottlenecks

## Playwright MCP Integration

**CRITICAL: Do NOT use MCP browser tools unless the user explicitly requests browser testing, debugging, or interaction.** Never use MCP tools proactively.

### MCP vs Traditional Testing

**Traditional Playwright** (test files):
- Automated test suites and CI/CD integration
- Regression testing and validation
- Batch execution of test scenarios

**Playwright MCP** (interactive, ONLY when user explicitly requests):
- Real-time browser exploration and debugging
- Interactive feature development and testing
- Immediate feedback during development sessions

### Available MCP Tools

#### Core Navigation and Control
- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_close` - Close browser sessions
- `mcp__playwright__browser_resize` - Adjust viewport size
- `mcp__playwright__browser_tabs` - Manage multiple tabs

#### Page Interaction
- `mcp__playwright__browser_click` - Click elements
- `mcp__playwright__browser_type` - Input text
- `mcp__playwright__browser_hover` - Hover over elements
- `mcp__playwright__browser_drag` - Drag and drop operations
- `mcp__playwright__browser_select_option` - Select dropdown options
- `mcp__playwright__browser_press_key` - Keyboard interactions

#### Data Capture and Analysis
- `mcp__playwright__browser_snapshot` - Get accessibility tree (preferred for actions)
- `mcp__playwright__browser_take_screenshot` - Visual capture
- `mcp__playwright__browser_evaluate` - Execute JavaScript
- `mcp__playwright__browser_console_messages` - View console output
- `mcp__playwright__browser_network_requests` - Monitor network activity

#### Advanced Features
- `mcp__playwright__browser_wait_for` - Wait for conditions
- `mcp__playwright__browser_fill_form` - Fill multiple form fields
- `mcp__playwright__browser_file_upload` - Handle file uploads
- `mcp__playwright__browser_handle_dialog` - Manage alerts/prompts

## MCP Development Workflows

### 1. Interactive Feature Development

```typescript
// Start development server
npm run dev

// Use MCP to navigate and test in real-time
await mcp__playwright__browser_navigate({ url: "http://localhost:3001" });
await mcp__playwright__browser_snapshot(); // Get page structure
```

### 2. CSV Import Feature Testing

```typescript
// Navigate to work notes module
await mcp__playwright__browser_navigate({ url: "http://localhost:3001/work-notes" });

// Open import dialog interactively
await mcp__playwright__browser_click({
  element: "Import Lightwright button",
  ref: "button_with_import_text"
});

// Upload test file
await mcp__playwright__browser_file_upload({
  paths: ["./tests/fixtures/lightwright-with-order.csv"]
});

// Verify results immediately
await mcp__playwright__browser_snapshot();
```

### 3. Position Manager Testing

```typescript
// Test position reordering
await mcp__playwright__browser_navigate({ url: "http://localhost:3001/positions" });

// Verify drag-and-drop functionality
await mcp__playwright__browser_drag({
  startElement: "First position item",
  startRef: "first_position_ref",
  endElement: "Second position item",
  endRef: "second_position_ref"
});

// Capture state change
await mcp__playwright__browser_take_screenshot({ filename: "position-reorder.png" });
```

### 4. Cross-Module Integration Testing

```typescript
// Test workflow across modules
await mcp__playwright__browser_navigate({ url: "http://localhost:3001/positions" });

// Modify position order
await mcp__playwright__browser_click({
  element: "Reorder button",
  ref: "reorder_btn"
});

// Navigate to work notes to verify impact
await mcp__playwright__browser_navigate({ url: "http://localhost:3001/work-notes" });

// Check if work notes reflect position changes
await mcp__playwright__browser_snapshot();
```

## MCP Development Patterns

### 1. Exploration Pattern
```typescript
// Start with navigation
await mcp__playwright__browser_navigate({ url: "target_url" });

// Get page structure
await mcp__playwright__browser_snapshot();

// Explore interactively based on snapshot
await mcp__playwright__browser_click({ element: "...", ref: "..." });
```

### 2. Form Testing Pattern
```typescript
// Navigate to form
await mcp__playwright__browser_navigate({ url: "form_page" });

// Fill form using bulk operation
await mcp__playwright__browser_fill_form({
  fields: [
    { name: "Title", type: "textbox", ref: "title_input", value: "Test Note" },
    { name: "Priority", type: "combobox", ref: "priority_select", value: "high" }
  ]
});

// Submit and verify
await mcp__playwright__browser_click({ element: "Save button", ref: "save_btn" });
```

### 3. Error State Testing
```typescript
// Test error handling
await mcp__playwright__browser_file_upload({
  paths: ["./invalid-file.csv"]
});

// Check console for errors
await mcp__playwright__browser_console_messages();

// Verify error UI
await mcp__playwright__browser_snapshot();
```

### 4. Performance Monitoring
```typescript
// Monitor network requests during heavy operations
await mcp__playwright__browser_navigate({ url: "data_heavy_page" });

// Perform operation
await mcp__playwright__browser_click({ element: "Load data", ref: "load_btn" });

// Check network activity
await mcp__playwright__browser_network_requests();
```

## MCP Best Practices

### 1. Always Use Snapshots Before Actions
```typescript
// Get page state first
await mcp__playwright__browser_snapshot();

// Then interact based on snapshot data
await mcp__playwright__browser_click({ element: "Button", ref: "ref_from_snapshot" });
```

### 2. Combine with Screenshots for Visual Verification
```typescript
// Capture before state
await mcp__playwright__browser_take_screenshot({ filename: "before-action.png" });

// Perform action
await mcp__playwright__browser_click({ element: "Action button", ref: "action_ref" });

// Capture after state
await mcp__playwright__browser_take_screenshot({ filename: "after-action.png" });
```

### 3. Use JavaScript Evaluation for Complex Checks
```typescript
// Check complex state
await mcp__playwright__browser_evaluate({
  function: "() => ({ noteCount: document.querySelectorAll('[data-testid=\"note-row\"]').length, hasError: document.querySelector('.error-message') !== null })"
});
```

### 4. Wait for Dynamic Content
```typescript
// Wait for specific text to appear
await mcp__playwright__browser_wait_for({ text: "Import completed successfully" });

// Wait for elements to disappear
await mcp__playwright__browser_wait_for({ textGone: "Loading..." });

// Wait for time-based operations
await mcp__playwright__browser_wait_for({ time: 2 });
```

## MCP Integration with Traditional Testing

### Development Cycle
1. **Explore with MCP** - Interactive feature development and debugging
2. **Write traditional tests** - Codify successful MCP patterns into test files
3. **Run test suite** - Validate with `npm run test:e2e`
4. **Iterate with MCP** - Debug failures interactively

### Converting MCP Patterns to Tests
```typescript
// MCP exploration pattern
await mcp__playwright__browser_navigate({ url: "/work-notes" });
await mcp__playwright__browser_click({ element: "Add note", ref: "add_btn" });

// Convert to traditional test
test('should add new work note', async ({ page }) => {
  await page.goto('/work-notes');
  await page.getByTestId('add-note-button').click();
  // ... rest of test
});
```

## Troubleshooting with MCP

### Debug Failed Tests
```typescript
// Reproduce test failure interactively
await mcp__playwright__browser_navigate({ url: "failing_test_url" });

// Step through actions one by one
await mcp__playwright__browser_snapshot();
await mcp__playwright__browser_click({ element: "...", ref: "..." });

// Check console for errors
await mcp__playwright__browser_console_messages();

// Inspect network requests
await mcp__playwright__browser_network_requests();
```

### Validate Fixes
```typescript
// Test fix in real-time
await mcp__playwright__browser_navigate({ url: "fixed_feature_url" });

// Verify behavior
await mcp__playwright__browser_click({ element: "...", ref: "..." });
await mcp__playwright__browser_wait_for({ text: "Expected success message" });

// Confirm with screenshot
await mcp__playwright__browser_take_screenshot({ filename: "fix-verification.png" });
```

## MCP Configuration

### Viewport and Device Testing
```typescript
// Test mobile viewport
await mcp__playwright__browser_resize({ width: 375, height: 812 });
await mcp__playwright__browser_take_screenshot({ filename: "mobile-view.png" });

// Return to desktop
await mcp__playwright__browser_resize({ width: 1280, height: 720 });
```

### Network Monitoring
```typescript
// Monitor all network activity
await mcp__playwright__browser_network_requests();

// Useful for debugging API calls, image loading, etc.
```

---

**Remember:** MCP provides immediate feedback and interactive debugging capabilities that complement the comprehensive test suite. Only use MCP tools when the user explicitly requests browser testing or interaction. Never use MCP tools proactively. Use MCP for exploration and rapid iteration only when requested, then codify stable patterns into traditional test files for CI/CD integration.
