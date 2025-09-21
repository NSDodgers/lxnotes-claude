# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (runs on localhost:3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Traditional Playwright Testing
npm run test:e2e                          # Run all E2E tests
npx playwright test --headed              # Run tests with visible browser
npx playwright test --ui                  # Interactive test runner
npx playwright show-report                # View test results

# Playwright MCP (Interactive Browser Control)
# MCP tools available when specifically requested by the user:
# - mcp__playwright__browser_navigate      # Navigate to URLs
# - mcp__playwright__browser_snapshot      # Get page structure
# - mcp__playwright__browser_click         # Click elements
# - mcp__playwright__browser_take_screenshot # Capture visuals
# Note: Only use MCP tools when user explicitly requests browser testing/interaction
```

## Architecture Overview

This is **LX Notes**, a theatrical production notes management system built with Next.js 15 and TypeScript. The app manages three distinct note modules for theater lighting and production teams.

### Core Architecture

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with dark theme as default
- **State Management**: Zustand for client state
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (with mock client for development)

### Module Structure

The app is organized around three core modules:

1. **Cue Notes** (`/cue-notes`) - Purple theme
   - Lighting cues and effects management
   - Links to script pages and scenes/songs
   - Uses `scriptPageId` and `sceneSongId` fields

2. **Work Notes** (`/work-notes`) - Blue theme  
   - Equipment and technical task tracking
   - Lightwright CSV data integration
   - Uses `lightwrightItemId` field

3. **Production Notes** (`/production-notes`) - Cyan theme
   - Cross-department communication
   - No external lookups required

### Key Data Models

All notes share common fields defined in `types/index.ts`:
- `moduleType`: 'cue' | 'work' | 'production'
- `status`: 'todo' | 'complete' | 'cancelled'  
- `priority`: 'high' | 'medium' | 'low'

Module-specific fields:
- `scriptPageId` - for Cue Notes
- `sceneSongId` - for Cue Notes  
- `lightwrightItemId` - for Work Notes

### Development Mode

The app uses a development mode system:
- Mock Supabase client in `lib/supabase/client.ts`
- No authentication required when `NEXT_PUBLIC_DEV_MODE=true`
- All data is mock data, not persisted
- Dark theme enabled by default in root layout

### Component Organization

- `app/` - Next.js App Router pages for each module
- `components/layout/` - Sidebar and dashboard layout components
- `components/providers.tsx` - React Query and other providers
- `lib/utils.ts` - Utility functions including `cn()` for conditional classes

### Styling System

- Dark theme optimized for theater environments
- Module-specific color coding (purple/blue/cyan)
- Status indicators (blue=todo, green=complete, gray=cancelled)
- Priority colors (red=high, orange=medium, green=low)
- Responsive sidebar that collapses

### Path Aliases

Uses `@/*` for absolute imports from project root via tsconfig paths.

## Playwright E2E Testing Integration

This project uses Playwright for comprehensive end-to-end testing. **CRITICAL: Do NOT use Playwright or browser automation tools unless the user explicitly requests it.** The testing infrastructure is available for development, validation, and quality assurance only when specifically asked for by the user.

### Test Architecture

The project follows a structured testing approach:
- **Tests Location**: `tests/e2e/` - Organized by feature modules
- **Test Utilities**: `tests/utils/test-helpers.ts` - Common testing patterns
- **Test Data**: `tests/fixtures/` - Mock data and selectors
- **Module Tests**: `cue-notes.spec.ts`, `work-notes.spec.ts`, `production-notes.spec.ts`

### Development Workflow with Playwright

#### 1. Feature Development Workflow
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

#### 2. Visual Verification Workflow
- Use `page.screenshot()` for visual regression testing
- Capture before/after states for UI changes
- Store screenshots in `test-results/` for comparison

#### 3. Interactive Development
```bash
# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in UI mode (interactive debugging)
npx playwright test --ui

# Debug specific test
npx playwright test --debug tests/e2e/position-order.spec.ts
```

### Testing Patterns

#### Using TestHelpers
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

#### Data-TestId Strategy
Use data-testid attributes for reliable element selection:
```html
<!-- Good: Stable identifier -->
<button data-testid="import-lightwright-button">Import</button>

<!-- Avoid: Fragile selectors -->
<button class="bg-blue-500 hover:bg-blue-600">Import</button>
```

#### Wait Strategies
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

### Testing Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/work-notes.spec.ts

# Run tests matching pattern
npx playwright test --grep "position order"

# Run tests in headed mode (visual)
npx playwright test --headed

# Generate test report
npx playwright show-report

# Update snapshots
npx playwright test --update-snapshots
```

### Common Testing Scenarios

#### CSV Import Testing
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

#### Drag-and-Drop Testing
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

#### Module-Specific Testing
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

### Best Practices

#### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names that explain the behavior
- Follow AAA pattern: Arrange, Act, Assert

#### 2. Stability
- Always use `waitForAppReady()` before interactions
- Prefer data-testid over fragile CSS selectors
- Handle loading states appropriately

#### 3. Error Handling
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

#### 4. Performance Testing
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

### Integration with Development

#### Visual Regression Testing
```typescript
test('position manager visual consistency', async ({ page }) => {
  await page.goto('/positions');
  await helpers.waitForAppReady();

  // Take screenshot for visual comparison
  await expect(page).toHaveScreenshot('position-manager.png');
});
```

#### Cross-Feature Testing
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

Remember: Playwright tests provide reliable automation, comprehensive coverage, and integration with CI/CD pipelines. Use them to validate features, catch regressions, and ensure consistent user experiences across the application.

## Playwright MCP Integration

This project has Playwright MCP (Model Context Protocol) available for interactive browser automation. **CRITICAL: Do NOT use MCP browser tools unless the user explicitly requests browser testing, debugging, or interaction.** Never use MCP tools proactively. MCP complements traditional Playwright testing by providing immediate browser control within Claude Code sessions only when specifically requested.

### MCP vs Traditional Testing

**Traditional Playwright** (test files):
- Automated test suites and CI/CD integration
- Regression testing and validation
- Batch execution of test scenarios

**Playwright MCP** (interactive, ONLY when user explicitly requests):
- Real-time browser exploration and debugging (ONLY when user explicitly requests it)
- Interactive feature development and testing (ONLY when user explicitly requests it)
- Immediate feedback during development sessions (ONLY when user explicitly requests it)

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

### Development Workflows with MCP

#### 1. Interactive Feature Development

```typescript
// Start development server
npm run dev

// Use MCP to navigate and test in real-time
await mcp__playwright__browser_navigate({ url: "http://localhost:3001" });
await mcp__playwright__browser_snapshot(); // Get page structure
```

#### 2. CSV Import Feature Testing

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

#### 3. Position Manager Testing

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

#### 4. Cross-Module Integration Testing

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

### MCP Development Patterns

#### 1. Exploration Pattern
```typescript
// Start with navigation
await mcp__playwright__browser_navigate({ url: "target_url" });

// Get page structure
await mcp__playwright__browser_snapshot();

// Explore interactively based on snapshot
await mcp__playwright__browser_click({ element: "...", ref: "..." });
```

#### 2. Form Testing Pattern
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

#### 3. Error State Testing
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

#### 4. Performance Monitoring
```typescript
// Monitor network requests during heavy operations
await mcp__playwright__browser_navigate({ url: "data_heavy_page" });

// Perform operation
await mcp__playwright__browser_click({ element: "Load data", ref: "load_btn" });

// Check network activity
await mcp__playwright__browser_network_requests();
```

### MCP Best Practices

#### 1. Always Use Snapshots Before Actions
```typescript
// Get page state first
await mcp__playwright__browser_snapshot();

// Then interact based on snapshot data
await mcp__playwright__browser_click({ element: "Button", ref: "ref_from_snapshot" });
```

#### 2. Combine with Screenshots for Visual Verification
```typescript
// Capture before state
await mcp__playwright__browser_take_screenshot({ filename: "before-action.png" });

// Perform action
await mcp__playwright__browser_click({ element: "Action button", ref: "action_ref" });

// Capture after state
await mcp__playwright__browser_take_screenshot({ filename: "after-action.png" });
```

#### 3. Use JavaScript Evaluation for Complex Checks
```typescript
// Check complex state
await mcp__playwright__browser_evaluate({
  function: "() => ({ noteCount: document.querySelectorAll('[data-testid=\"note-row\"]').length, hasError: document.querySelector('.error-message') !== null })"
});
```

#### 4. Wait for Dynamic Content
```typescript
// Wait for specific text to appear
await mcp__playwright__browser_wait_for({ text: "Import completed successfully" });

// Wait for elements to disappear
await mcp__playwright__browser_wait_for({ textGone: "Loading..." });

// Wait for time-based operations
await mcp__playwright__browser_wait_for({ time: 2 });
```

### MCP Integration with Traditional Testing

#### Development Cycle
1. **Explore with MCP** - Interactive feature development and debugging
2. **Write traditional tests** - Codify successful MCP patterns into test files
3. **Run test suite** - Validate with `npm run test:e2e`
4. **Iterate with MCP** - Debug failures interactively

#### Converting MCP Patterns to Tests
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

### Troubleshooting with MCP

#### Debug Failed Tests
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

#### Validate Fixes
```typescript
// Test fix in real-time
await mcp__playwright__browser_navigate({ url: "fixed_feature_url" });

// Verify behavior
await mcp__playwright__browser_click({ element: "...", ref: "..." });
await mcp__playwright__browser_wait_for({ text: "Expected success message" });

// Confirm with screenshot
await mcp__playwright__browser_take_screenshot({ filename: "fix-verification.png" });
```

### MCP Configuration

MCP automatically handles browser setup, but you can customize behavior:

#### Viewport and Device Testing
```typescript
// Test mobile viewport
await mcp__playwright__browser_resize({ width: 375, height: 812 });
await mcp__playwright__browser_take_screenshot({ filename: "mobile-view.png" });

// Return to desktop
await mcp__playwright__browser_resize({ width: 1280, height: 720 });
```

#### Network Monitoring
```typescript
// Monitor all network activity
await mcp__playwright__browser_network_requests();

// Useful for debugging API calls, image loading, etc.
```

Remember: MCP provides immediate feedback and interactive debugging capabilities that complement the comprehensive test suite. **CRITICAL: Only use MCP tools when the user explicitly and specifically requests browser testing or interaction. Never use MCP tools proactively or for testing unless explicitly asked.** Use MCP for exploration and rapid iteration only when requested, then codify stable patterns into traditional test files for CI/CD integration.

## Sessions System Behaviors

@CLAUDE.sessions.md
