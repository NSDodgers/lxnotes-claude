import { Page, expect } from '@playwright/test';
import { selectors, testIds } from '../fixtures/test-data';

export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToModule(module: 'cue-notes' | 'work-notes' | 'electrician-notes' | 'production-notes' | 'settings') {
    const linkMap = {
      'cue-notes': selectors.sidebar.cueNotesLink,
      'work-notes': selectors.sidebar.workNotesLink,
      'electrician-notes': selectors.sidebar.electricianNotesLink,
      'production-notes': selectors.sidebar.productionNotesLink,
      'settings': selectors.sidebar.settingsLink,
    };

    await this.page.click(linkMap[module]);
    await this.page.waitForURL(`**/${module}`);
  }

  // Wait for hydration and stores to initialize
  async waitForAppReady() {
    // Wait for React hydration
    await this.page.waitForLoadState('networkidle');

    // Wait for app to be ready - sidebar (desktop), mobile top bar, or designer mode indicator
    await this.page.waitForSelector(
      '[data-testid="sidebar"], [data-testid="mobile-top-bar"], [data-testid="designer-mode-indicator"]',
      { timeout: 15000 }
    );

    // Give a moment for Zustand stores to initialize
    await this.page.waitForTimeout(1000);
  }

  // Dialog helpers
  async openDialog(triggerSelector: string) {
    await this.page.click(triggerSelector);
    await this.page.waitForSelector(selectors.dialog.container);
  }

  async closeDialog() {
    // Use cancel button or press Escape
    const cancelButton = this.page.locator(selectors.dialog.cancelButton);
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.page.waitForSelector(selectors.dialog.container, { state: 'hidden' });
  }

  async fillNoteForm(noteData: {
    description?: string;
    cueNumbers?: string;
  }) {
    if (noteData.description) {
      await this.page.fill(selectors.forms.descriptionInput, noteData.description);
    }
    if (noteData.cueNumbers) {
      await this.page.fill(selectors.forms.cueNumbers, noteData.cueNumbers);
    }
  }

  async saveDialog() {
    await this.page.click(selectors.dialog.saveButton);
    await this.page.waitForSelector(selectors.dialog.container, { state: 'hidden' });
  }

  // Table helpers
  async getTableRowCount() {
    return await this.page.locator(selectors.notes.noteRow).count();
  }

  // Filter helpers
  async setStatusFilter(status: 'todo' | 'complete' | 'cancelled') {
    const statusMap = {
      'todo': selectors.notes.statusFilterTodo,
      'complete': selectors.notes.statusFilterComplete,
      'cancelled': selectors.notes.statusFilterCancelled,
    };
    await this.page.click(statusMap[status]);
  }

  async searchNotes(searchTerm: string) {
    await this.page.fill(selectors.notes.searchInput, searchTerm);
    // Wait for debounced search
    await this.page.waitForTimeout(500);
  }

  // Settings helpers
  async navigateToSettingsTab(tab: 'general' | 'cue-notes' | 'work-notes' | 'production-notes' | 'presets') {
    await this.navigateToModule('settings');
    await this.page.click(selectors.settings.tabs[tab as keyof typeof selectors.settings.tabs]);
  }

  // Preset helpers
  async createPageStylePreset(name: string, config: {
    paperSize: 'a4' | 'letter' | 'legal';
    orientation: 'portrait' | 'landscape';
    includeCheckboxes: boolean;
  }) {
    await this.navigateToSettingsTab('presets');
    // Building block presets are in the collapsible section
    await this.expandBuildingBlocks();
    await this.page.click(`${selectors.settings.presets.pageStyleSection} ${selectors.settings.presets.addButton}`);

    await this.page.fill('[data-testid="preset-name"]', name);
    await this.page.selectOption('[data-testid="paper-size"]', config.paperSize);
    await this.page.selectOption('[data-testid="orientation"]', config.orientation);

    if (config.includeCheckboxes) {
      await this.page.check('[data-testid="include-checkboxes"]');
    } else {
      await this.page.uncheck('[data-testid="include-checkboxes"]');
    }

    await this.saveDialog();
  }

  async createFilterSortPreset(name: string, moduleType: 'cue' | 'work' | 'electrician' | 'production') {
    await this.navigateToSettingsTab('presets');
    await this.expandBuildingBlocks();
    await this.page.click(`${selectors.settings.presets.filterSortSection} ${selectors.settings.presets.addButton}`);

    await this.page.fill('[data-testid="preset-name"]', name);
    await this.page.selectOption('[data-testid="module-type"]', moduleType);

    await this.saveDialog();
  }

  // Building Blocks section is collapsed by default on the Presets tab
  async expandBuildingBlocks() {
    const toggle = this.page.locator('[data-testid="building-blocks-toggle"]');
    // Check if the section is already expanded by looking for filter/sort content
    const filterSection = this.page.locator(selectors.settings.presets.filterSortSection);
    if (!(await filterSection.isVisible().catch(() => false))) {
      await toggle.click();
      await this.page.waitForTimeout(300);
    }
  }

  // Print/Email helpers — new card-based flow
  async openPrintSidebar(module: 'cue' | 'work' | 'electrician' | 'production') {
    await this.navigateToModule(`${module}-notes` as any);
    await this.page.click(selectors.printEmail.printButton);
    // Sidebar now shows card grid
    await this.page.waitForSelector('[data-testid="preset-card-grid"], [role="dialog"]', { timeout: 5000 });
  }

  async openEmailSidebar(module: 'cue' | 'work' | 'electrician' | 'production') {
    await this.navigateToModule(`${module}-notes` as any);
    await this.page.click(selectors.printEmail.emailButton);
    await this.page.waitForSelector('[data-testid="preset-card-grid"], [role="dialog"]', { timeout: 5000 });
  }

  /** @deprecated Use openPrintSidebar */
  async openPrintView(module: 'cue' | 'work' | 'production') {
    return this.openPrintSidebar(module);
  }

  /** @deprecated Use openEmailSidebar */
  async openEmailView(module: 'cue' | 'work' | 'production') {
    return this.openEmailSidebar(module);
  }

  async selectPresetCard(presetName: string) {
    const card = this.page.locator(`[data-testid^="preset-card-"]:has-text("${presetName}")`);
    await card.click();
    await this.page.waitForSelector('[data-testid="confirm-send-panel"]', { timeout: 5000 });
  }

  /** @deprecated Use selectPresetCard */
  async selectPreset(selectorTestId: string, presetName: string) {
    await this.page.click(`[data-testid="${selectorTestId}"]`);
    await this.page.click(`[data-testid="preset-option"]:has-text("${presetName}")`);
  }

  // Responsive helpers
  async setViewportSize(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
  }

  async testMobileLayout() {
    await this.setViewportSize(375, 667);
  }

  async testTabletLayout() {
    await this.setViewportSize(1024, 768);
  }

  async testDesktopLayout() {
    await this.setViewportSize(1920, 1080);
  }

  // Designer mode helpers
  async enableDesignerMode() {
    await this.page.click(selectors.sidebar.designerModeToggle);
    await expect(this.page.locator('[data-testid="designer-mode-indicator"]')).toBeVisible();
  }

  // Wait helpers
  async waitForLoading() {
    await this.page.waitForSelector(`[data-testid="${testIds.LOADING_SPINNER}"]`, { state: 'hidden' });
  }

  async waitForSuccess() {
    await this.page.waitForSelector(`[data-testid="${testIds.SUCCESS_MESSAGE}"]`);
  }

  async waitForError() {
    await this.page.waitForSelector(`[data-testid="${testIds.ERROR_MESSAGE}"]`);
  }

  // Assertion helpers
  async expectPageTitle(title: string) {
    await expect(this.page.locator('h1')).toContainText(title);
  }

  async expectNoteInTable(noteDescription: string) {
    await expect(this.page.locator(selectors.notes.notesTable)).toContainText(noteDescription);
  }

  async expectNoteNotInTable(noteDescription: string) {
    await expect(this.page.locator(selectors.notes.notesTable)).not.toContainText(noteDescription);
  }

  async expectPresetExists(presetName: string) {
    await expect(this.page.locator(selectors.settings.presets.presetCard)).toContainText(presetName);
  }

  // Performance helpers
  async measurePageLoad() {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureInteraction(action: () => Promise<void>) {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  }

  // Console error detection
  async collectConsoleErrors() {
    const errors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  // Local storage helpers
  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  async getStoreData(storeName: string) {
    return await this.page.evaluate((name) => {
      const data = localStorage.getItem(name);
      return data ? JSON.parse(data) : null;
    }, storeName);
  }

  // Screenshot helpers
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `tests/screenshots/${name}.png`,
      fullPage: true
    });
  }
}
