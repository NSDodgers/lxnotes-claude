# PDF Generation Test Suite

This comprehensive test suite validates the entire PDF generation system, including page style presets, filter/sort presets, and all edge cases using Puppeteer automation.

## Overview

The test suite verifies that:
- ✅ All page style presets generate correct PDF layouts
- ✅ All filter/sort presets apply correct content filtering
- ✅ Module-specific features work properly
- ✅ Custom presets can be created and used
- ✅ Visual consistency is maintained
- ✅ Error conditions are handled gracefully

## Test Structure

```
tests/e2e/pdf-generation/
├── pdf-test-helpers.ts          # Utility functions for PDF testing
├── page-style-presets.spec.ts   # Test all page styles and paper sizes
├── filter-sort-presets.spec.ts  # Test content filtering and sorting
├── module-specific.spec.ts      # Test unique features per module
├── custom-presets.spec.ts       # Test custom preset creation
├── visual-regression.spec.ts    # Test visual consistency
├── error-handling.spec.ts       # Test edge cases and errors
├── playwright.config.ts         # Playwright configuration
├── run-all-tests.ts            # Complete test suite runner
├── screenshots/                 # Generated screenshots
├── baselines/                   # Baseline PDFs for comparison
└── test-results/               # Test execution results
```

## Running the Tests

### Prerequisites

1. **Development server running**:
   ```bash
   npm run dev
   ```

2. **Install Playwright** (if not already installed):
   ```bash
   npx playwright install
   ```

### Run Complete Test Suite

```bash
# Run all PDF generation tests
npx ts-node tests/e2e/pdf-generation/run-all-tests.ts

# Or using the test runner directly
npx playwright test tests/e2e/pdf-generation --config=tests/e2e/pdf-generation/playwright.config.ts
```

### Run Individual Test Files

```bash
# Test page style presets only
npx playwright test tests/e2e/pdf-generation/page-style-presets.spec.ts

# Test filter presets only
npx playwright test tests/e2e/pdf-generation/filter-sort-presets.spec.ts

# Test custom preset creation
npx playwright test tests/e2e/pdf-generation/custom-presets.spec.ts

# Test error handling
npx playwright test tests/e2e/pdf-generation/error-handling.spec.ts
```

### Run Visual Regression Tests

```bash
# Generate baseline PDFs (run once)
npx playwright test tests/e2e/pdf-generation/visual-regression.spec.ts -g "baseline"

# Run regression comparison
npx playwright test tests/e2e/pdf-generation/visual-regression.spec.ts -g "Compare"
```

## Test Coverage

### Page Style Presets (page-style-presets.spec.ts)
- ✅ Letter Portrait, Letter Landscape, A4 Portrait (system defaults)
- ✅ Custom paper sizes: A4 Landscape, Legal Portrait
- ✅ Checkbox inclusion/exclusion settings
- ✅ All module types with all page styles
- ✅ Visual validation of PDF elements

### Filter/Sort Presets (filter-sort-presets.spec.ts)
- ✅ All system default presets per module
- ✅ Status filtering (todo, complete, cancelled, all)
- ✅ Type filtering (module-specific types)
- ✅ Priority filtering (module-specific priorities)
- ✅ Sort orders (ascending vs descending)
- ✅ Grouping vs non-grouping layouts
- ✅ Custom filter combinations

### Module-Specific Features (module-specific.spec.ts)
- ✅ **Cue Notes**: Script page and scene/song columns, cue number sorting
- ✅ **Work Notes**: Channel and position columns, extended priority scale
- ✅ **Production Notes**: Department grouping, simplified layout
- ✅ Cross-module comparison and validation

### Custom Presets (custom-presets.spec.ts)
- ✅ Create custom page style presets
- ✅ Create custom filter/sort presets
- ✅ Edit existing presets
- ✅ Complex preset configurations
- ✅ Preset persistence across sessions

### Visual Regression (visual-regression.spec.ts)
- ✅ Baseline PDF generation for all presets
- ✅ Comparison against baselines
- ✅ Font and styling consistency
- ✅ Color consistency in type badges
- ✅ Header/footer layout validation

### Error Handling (error-handling.spec.ts)
- ✅ Missing preset selection validation
- ✅ Empty dataset handling
- ✅ Special characters in preset names
- ✅ Network condition simulation
- ✅ Performance under load
- ✅ UI interaction edge cases

## Test Results

After running tests, results are available in:

- **Screenshots**: `tests/e2e/pdf-generation/screenshots/`
- **Baseline PDFs**: `tests/e2e/pdf-generation/baselines/`
- **Test Reports**: `tests/e2e/pdf-generation/test-results/`
- **Summary Report**: `tests/e2e/pdf-generation/test-results/test-suite-summary.json`

## Understanding Test Output

### Success Indicators
- ✅ All PDF generations complete without errors
- ✅ Generated PDFs have valid structure and content
- ✅ File sizes are reasonable (>1KB for content)
- ✅ Filenames contain correct module names
- ✅ Visual consistency maintained across configurations

### Common Issues
- ❌ **Selector timeouts**: UI elements not found (check if dev server is running)
- ❌ **PDF validation failures**: Invalid PDF structure or empty content
- ❌ **Download failures**: Browser download permissions or network issues
- ❌ **Visual regressions**: Changes in PDF layout or content

## Debugging Failed Tests

1. **Check screenshots** in `screenshots/` directory
2. **Review test artifacts** in `test-results/`
3. **Verify dev server** is running on localhost:3001
4. **Check browser permissions** for downloads
5. **Review error logs** in test output

## Extending the Tests

### Adding New Test Cases

1. **New page style configurations**:
   ```typescript
   await pdfHelpers.createCustomPageStylePreset('Custom Config', {
     paperSize: 'legal',
     orientation: 'landscape',
     includeCheckboxes: false
   })
   ```

2. **New filter combinations**:
   ```typescript
   await pdfHelpers.createCustomFilterPreset('Custom Filter', 'cue', {
     statusFilter: 'todo',
     typeFilters: ['cue', 'director'],
     sortBy: 'priority',
     sortOrder: 'desc'
   })
   ```

3. **New validation criteria**:
   ```typescript
   const validation = await pdfHelpers.validatePDF(pdfBlob, {
     moduleType: 'cue',
     expectedPaperSize: 'letter',
     shouldIncludeCheckboxes: true
   })
   ```

### Performance Considerations

- Tests run sequentially to avoid resource conflicts
- Each test includes cleanup (dialog closing, navigation)
- Screenshots are taken for debugging but can be disabled for speed
- Large dataset tests have extended timeouts

## Integration with CI/CD

To run in continuous integration:

```yaml
# GitHub Actions example
- name: Run PDF Generation Tests
  run: |
    npm run dev &
    sleep 10
    npx playwright test tests/e2e/pdf-generation
    kill %1
```

The test suite is designed to be robust and provide comprehensive validation of the entire PDF generation system.