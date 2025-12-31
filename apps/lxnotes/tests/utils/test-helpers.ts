import { Page, Locator, expect } from '@playwright/test';
import { selectors, testIds } from '../fixtures/test-data';

export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToModule(module: 'cue-notes' | 'work-notes' | 'production-notes' | 'settings') {
    const linkMap = {
      'cue-notes': selectors.sidebar.cueNotesLink,
      'work-notes': selectors.sidebar.workNotesLink,
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
    
    // Wait for app to be ready - sidebar should be visible and functional
    await this.page.waitForSelector('[data-testid="sidebar"]', { timeout: 15000 });
    
    // Give a moment for Zustand stores to initialize
    await this.page.waitForTimeout(1000);
    
    // Optionally check that stores are ready (but don't require specific localStorage keys)
    await this.page.waitForFunction(() => {
      return document.querySelector('[data-testid="sidebar"]') !== null;
    }, { timeout: 5000 });
  }

  // Dialog helpers
  async openDialog(triggerSelector: string) {
    await this.page.click(triggerSelector);
    await this.page.waitForSelector(selectors.dialog.container);
  }

  async closeDialog() {
    await this.page.click(selectors.dialog.closeButton);
    await this.page.waitForSelector(selectors.dialog.container, { state: 'hidden' });
  }

  async fillNoteForm(noteData: {
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    status?: string;
  }) {
    if (noteData.title) {
      await this.page.fill(selectors.forms.titleInput, noteData.title);
    }
    if (noteData.description) {
      await this.page.fill(selectors.forms.descriptionInput, noteData.description);
    }
    if (noteData.type) {
      await this.page.selectOption(selectors.forms.typeSelect, noteData.type);
    }
    if (noteData.priority) {
      await this.page.selectOption(selectors.forms.prioritySelect, noteData.priority);
    }
    if (noteData.status) {
      await this.page.selectOption(selectors.forms.statusSelect, noteData.status);
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

  async clickNoteAction(noteTitle: string, action: 'edit' | 'status') {
    const row = this.page.locator(selectors.notes.noteRow).filter({ hasText: noteTitle });
    const actionMap = {
      'edit': selectors.notes.editButton,
      'status': selectors.notes.statusButton,
    };
    await row.locator(actionMap[action]).click();
  }

  // Filter helpers
  async setStatusFilter(status: 'todo' | 'complete' | 'cancelled') {
    await this.page.click(`${selectors.notes.statusFilter}[data-status="${status}"]`);
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

  async createFilterSortPreset(name: string, moduleType: 'cue' | 'work' | 'production') {
    await this.navigateToSettingsTab('presets');
    await this.page.click(`${selectors.settings.presets.filterSortSection} ${selectors.settings.presets.addButton}`);
    
    await this.page.fill('[data-testid="preset-name"]', name);
    await this.page.selectOption('[data-testid="module-type"]', moduleType);
    
    await this.saveDialog();
  }

  // Print/Email helpers
  async openPrintView(module: 'cue' | 'work' | 'production') {
    await this.navigateToModule(`${module}-notes` as any);
    await this.page.click(selectors.printEmail.printButton);
    await this.page.waitForSelector('[data-testid="print-dialog"]');
  }

  async openEmailView(module: 'cue' | 'work' | 'production') {
    await this.navigateToModule(`${module}-notes` as any);
    await this.page.click(selectors.printEmail.emailButton);
    await this.page.waitForSelector('[data-testid="email-dialog"]');
  }

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

  // Tablet mode helpers
  async enableTabletMode() {
    await this.page.click(selectors.sidebar.tabletModeToggle);
    await expect(this.page.locator('[data-testid="tablet-mode-indicator"]')).toBeVisible();
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

  async expectNoteInTable(noteTitle: string) {
    await expect(this.page.locator(selectors.notes.notesTable)).toContainText(noteTitle);
  }

  async expectNoteNotInTable(noteTitle: string) {
    await expect(this.page.locator(selectors.notes.notesTable)).not.toContainText(noteTitle);
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