# LX Notes E2E Testing Framework

This directory contains a comprehensive end-to-end testing suite for the LX Notes theatrical production management application using Playwright.

## Test Suite Overview

### 📁 Directory Structure

```
tests/
├── e2e/                          # Main E2E test files
│   ├── navigation.spec.ts        # Core navigation and routing tests
│   ├── notes-modules/            # Module-specific tests
│   │   ├── cue-notes.spec.ts    # Cue Notes module tests
│   │   ├── work-notes.spec.ts   # Work Notes module tests
│   │   └── production-notes.spec.ts # Production Notes module tests
│   ├── presets/                  # Preset system tests
│   │   ├── email-message-presets.spec.ts # Email preset tests
│   │   ├── filter-sort-presets.spec.ts   # Filter & sort preset tests
│   │   └── page-style-presets.spec.ts    # Page style preset tests
│   ├── settings/                 # Settings and customization tests
│   │   └── custom-types-priorities.spec.ts # Custom types/priorities tests
│   ├── integration/              # Cross-feature integration tests
│   │   ├── print-email.spec.ts  # Print & email integration tests
│   │   └── cross-feature.spec.ts # Cross-feature integration tests
│   └── error-handling-performance.spec.ts # Error handling & performance tests
├── fixtures/                     # Test data and fixtures
│   └── test-data.ts             # Mock data and test fixtures
├── utils/                        # Test utilities and helpers
│   └── test-helpers.ts          # Reusable test helper functions
└── playwright.config.ts          # Playwright configuration
```

### 🎭 Test Categories

#### 1. **Core Navigation Tests** (`navigation.spec.ts`)
- Sidebar navigation and module switching
- URL routing and deep linking
- Responsive behavior (mobile/tablet/desktop)
- Accessibility navigation patterns

#### 2. **Notes Module Tests** (`notes-modules/`)
- **Cue Notes**: Script-based lighting cues, scene/song linking
- **Work Notes**: Equipment tracking, Lightwright integration, channel management
- **Production Notes**: Cross-department communication, no external lookups
- CRUD operations for all note types
- Module-specific filtering and search
- Custom types and priorities integration

#### 3. **Preset System Tests** (`presets/`)
- **Email Message Presets**: Template creation, placeholder system, email validation
- **Filter & Sort Presets**: Module-specific filtering, sort configuration
- **Page Style Presets**: PDF formatting, paper sizes, orientation
- Preset linking and referential integrity
- System vs custom preset management

#### 4. **Settings & Customization Tests** (`settings/`)
- Custom types management per module
- Custom priorities with 1-9 levels for work notes
- Import/export functionality
- Settings persistence and validation

#### 5. **Integration Tests** (`integration/`)
- **Print & Email**: PDF generation, email sending, preset selection
- **Cross-Feature**: Data consistency across views, theme consistency
- Performance under load
- Accessibility compliance

#### 6. **Error Handling & Performance** (`error-handling-performance.spec.ts`)
- Network failure recovery
- Form validation and error states
- Performance benchmarks
- Memory leak prevention
- Edge case handling

### 🔧 Configuration

#### Playwright Configuration (`playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Test Environment**: Next.js dev server on localhost:3001
- **Development Mode**: `NEXT_PUBLIC_DEV_MODE=true` for mock data
- **Timeouts**: Configured for reasonable test execution
- **Screenshots**: Captured on failure for debugging

### 🛠️ Test Utilities

#### TestHelpers Class (`utils/test-helpers.ts`)
Provides reusable methods for common test operations:

```typescript
// Navigation helpers
await helpers.navigateToModule('cue-notes');
await helpers.navigateToSettingsTab('presets');

// Note operations
await helpers.fillNoteForm({ title, description, type, priority });
await helpers.expectNoteInTable('Note Title');

// Dialog management
await helpers.openDialog('[data-testid="add-note-button"]');
await helpers.closeDialog();

// Search and filtering
await helpers.searchNotes('search term');
await helpers.setStatusFilter('todo');

// Preset operations
await helpers.createFilterSortPreset('Preset Name', 'cue');
```

#### Test Data (`fixtures/test-data.ts`)
- Mock note objects for all three modules
- Preset configuration objects
- Common test selectors and identifiers
- Helper functions for generating test data

### 🎯 Test Data Attributes

The application uses `data-testid` attributes for reliable element selection:

#### Core Elements
- `data-testid="sidebar"` - Main navigation sidebar
- `data-testid="notes-table"` - Main notes display table
- `data-testid="add-note-button"` - Note creation button
- `data-testid="note-dialog"` - Note creation/edit modal

#### Module-Specific Elements
- `data-testid="cue-notes-module"` - Cue Notes module container
- `data-testid="work-notes-module"` - Work Notes module container
- `data-testid="production-notes-module"` - Production Notes module container

#### Preset Elements
- `data-testid="email-message-presets"` - Email presets section
- `data-testid="filter-sort-presets"` - Filter presets section
- `data-testid="page-style-presets"` - Page style presets section

### 🚀 Running Tests

#### All Tests
```bash
npx playwright test
```

#### Specific Test Suite
```bash
npx playwright test tests/e2e/navigation.spec.ts
npx playwright test tests/e2e/notes-modules/
npx playwright test tests/e2e/presets/
```

#### Headed Mode (with browser UI)
```bash
npx playwright test --headed
```

#### Debug Mode
```bash
npx playwright test --debug
```

#### Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

### 📊 Test Coverage Areas

#### Functional Coverage
- ✅ All CRUD operations for notes
- ✅ All three preset types (Email, Filter/Sort, Page Style)
- ✅ Custom types and priorities management
- ✅ Print and email integration
- ✅ Search and filtering across all modules
- ✅ Settings import/export

#### UI/UX Coverage
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Theme consistency across modules
- ✅ Accessibility (keyboard navigation, ARIA labels)
- ✅ Loading states and error handling
- ✅ Dialog management and form validation

#### Integration Coverage
- ✅ Cross-module data consistency
- ✅ Preset linking and referential integrity
- ✅ Real-time updates across views
- ✅ Browser navigation (back/forward)
- ✅ Page refresh handling

#### Performance Coverage
- ✅ Initial page load times
- ✅ Navigation performance
- ✅ Search and filter performance
- ✅ Large dataset handling
- ✅ Memory leak prevention

### 🐛 Debugging Failed Tests

#### Screenshots
Failed tests automatically capture screenshots saved to `test-results/`

#### Trace Viewer
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

#### HTML Report
```bash
npx playwright show-report
```

### 🔄 CI/CD Integration

The test suite is designed for continuous integration:

#### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install

- name: Run E2E tests
  run: npx playwright test
  env:
    NEXT_PUBLIC_DEV_MODE: 'true'

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

### 📝 Writing New Tests

#### Test Structure Pattern
```typescript
test.describe('Feature Name', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test('should perform specific action', async ({ page }) => {
    // Test implementation
  });
});
```

#### Best Practices
1. Use `data-testid` for element selection
2. Leverage TestHelpers for common operations
3. Test both success and error paths
4. Include accessibility checks
5. Test responsive behavior
6. Clean up test data when needed
7. Use meaningful test descriptions

### 🎨 Module-Specific Testing Notes

#### Cue Notes Module
- Tests script page and scene/song linking
- Validates cue-specific types (Cue, Director, Designer)
- Checks purple theme consistency

#### Work Notes Module  
- Tests Lightwright integration fields
- Validates 1-9 priority levels
- Tests channel and position tracking
- Checks blue theme consistency

#### Production Notes Module
- Tests cross-department communication
- Validates production types (Scenic, Lighting, Costumes, Sound)
- Ensures no external lookup fields present
- Checks cyan theme consistency

This comprehensive testing framework ensures the LX Notes application maintains high quality and reliability across all features and use cases.