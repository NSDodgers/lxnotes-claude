import type { Note, CustomType, CustomPriority, ModuleType } from '../../types';

// Sample note data for testing
export const mockCueNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  productionId: 'prod-1',
  moduleType: 'cue',
  title: 'Test Fade House Lights',
  description: 'Slow fade to 50% over 3 seconds when actor enters',
  priority: 'critical',
  status: 'todo',
  type: 'Cue',
  scriptPageId: 'cue-127',
  sceneSongId: 'Act1-Scene3',
};

export const mockWorkNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  productionId: 'prod-1',
  moduleType: 'work',
  title: 'Focus Channel 47',
  description: 'Adjust focus for front wash position',
  priority: 'medium',
  status: 'todo',
  type: 'Focus',
  lightwrightItemId: 'lw-456',
  channelNumbers: '47',
  positionUnit: 'FOH-12',
};

export const mockProductionNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  productionId: 'prod-1',
  moduleType: 'production',
  title: 'Budget Review Meeting',
  description: 'Meet with producer to review lighting budget',
  priority: 'high',
  status: 'todo',
  type: 'Lighting',
};

// Custom types for testing
export const testCustomType: Omit<CustomType, 'id' | 'createdAt' | 'updatedAt'> = {
  productionId: 'prod-1',
  moduleType: 'cue',
  value: 'test_type',
  label: 'Test Type',
  color: '#FF5733',
  isSystem: false,
  isHidden: false,
  sortOrder: 100,
};

// Custom priorities for testing
export const testCustomPriority: Omit<CustomPriority, 'id' | 'createdAt' | 'updatedAt'> = {
  productionId: 'prod-1',
  moduleType: 'cue',
  value: 'test_priority',
  label: 'Test Priority',
  color: '#33FF57',
  sortOrder: 4.5, // Between medium and high
  isSystem: false,
  isHidden: false,
};

// Preset configurations for testing
export const testPageStylePreset = {
  name: 'Test Letter Portrait',
  paperSize: 'letter' as const,
  orientation: 'portrait' as const,
  includeCheckboxes: true,
};

export const testFilterSortPreset = {
  name: 'Test High Priority Filter',
  moduleType: 'cue' as ModuleType,
  statusFilter: 'todo' as const,
  typeFilters: ['Cue', 'Director'],
  priorityFilters: ['critical', 'high'],
  sortBy: 'priority',
  sortOrder: 'desc' as const,
  groupByType: false,
};

export const testEmailMessagePreset = {
  name: 'Test Daily Report',
  recipients: 'test@example.com, test2@example.com',
  subject: '{{PRODUCTION_TITLE}} - Test Report {{CURRENT_DATE}}',
  message: `Hello team,

Test report for {{PRODUCTION_TITLE}}.

Outstanding items: {{TODO_COUNT}}
Completed today: {{COMPLETE_COUNT}}

Best regards,
{{USER_FULL_NAME}}`,
  filterAndSortPresetId: null,
  pageStylePresetId: null,
  includeNotesInBody: true,
  attachPdf: false,
};

// Test selectors and data attributes
export const selectors = {
  sidebar: {
    toggle: '[data-testid="sidebar-toggle"]',
    cueNotesLink: 'a[href="/cue-notes"]',
    workNotesLink: 'a[href="/work-notes"]',
    productionNotesLink: 'a[href="/production-notes"]',
    settingsLink: 'a[href="/settings"]',
    tabletModeToggle: '[data-testid="tablet-mode-toggle"]',
  },
  notes: {
    addButton: '[data-testid="add-note-button"]',
    searchInput: '[data-testid="search-notes"]',
    statusFilter: '[data-testid="status-filter"]',
    typeFilter: '[data-testid="type-filter"]',
    notesTable: '[data-testid="notes-table"]',
    noteRow: '[data-testid="note-row"]',
    editButton: '[data-testid="edit-note"]',
    statusButton: '[data-testid="update-status"]',
  },
  dialog: {
    container: '[role="dialog"]',
    title: '[data-testid="dialog-title"]',
    closeButton: '[data-testid="dialog-close"]',
    saveButton: '[data-testid="save-button"]',
    cancelButton: '[data-testid="cancel-button"]',
  },
  forms: {
    titleInput: '[data-testid="note-title"]',
    descriptionInput: '[data-testid="note-description"]',
    typeSelect: '[data-testid="note-type"]',
    prioritySelect: '[data-testid="note-priority"]',
    statusSelect: '[data-testid="note-status"]',
  },
  settings: {
    tabs: {
      general: '[data-testid="tab-general"]',
      cueNotes: '[data-testid="tab-cue-notes"]',
      workNotes: '[data-testid="tab-work-notes"]',
      productionNotes: '[data-testid="tab-production-notes"]',
      presets: '[data-testid="tab-presets"]',
    },
    presets: {
      pageStyleSection: '[data-testid="page-style-presets"]',
      filterSortSection: '[data-testid="filter-sort-presets"]',
      emailMessageSection: '[data-testid="email-message-presets"]',
      addButton: '[data-testid="add-preset"]',
      presetCard: '[data-testid="preset-card"]',
      editButton: '[data-testid="edit-preset"]',
      deleteButton: '[data-testid="delete-preset"]',
    },
    customTypes: {
      addButton: '[data-testid="add-custom-type"]',
      typeRow: '[data-testid="custom-type-row"]',
      colorPicker: '[data-testid="color-picker"]',
    },
  },
  printEmail: {
    printButton: '[data-testid="print-notes-button"]',
    emailButton: '[data-testid="email-notes-button"]',
    cardGrid: '[data-testid="preset-card-grid"]',
    createNewCard: '[data-testid="preset-card-create-new"]',
    customOneOff: '[data-testid="preset-card-custom-one-off"]',
    confirmPanel: '[data-testid="confirm-send-panel"]',
    confirmBack: '[data-testid="confirm-panel-back"]',
    confirmSubmit: '[data-testid="confirm-panel-submit"]',
    wizard: '[data-testid="preset-wizard"]',
    generateButton: '[data-testid="generate-pdf"]',
    sendButton: '[data-testid="send-email"]',
  },
};

export const testPrintPreset = {
  name: 'Test Cue Print Preset',
  moduleType: 'cue' as ModuleType,
  filterSortPresetId: null,
  pageStylePresetId: null,
};

// Test data generators
export const generateTestNote = (overrides: Partial<typeof mockCueNote> = {}) => ({
  ...mockCueNote,
  ...overrides,
  title: `Test Note ${Date.now()}`,
});

export const generateTestEmail = () => `test-${Date.now()}@example.com`;

// Common test utilities
export const testIds = {
  LOADING_SPINNER: 'loading-spinner',
  ERROR_MESSAGE: 'error-message',
  SUCCESS_MESSAGE: 'success-message',
  CONFIRMATION_DIALOG: 'confirmation-dialog',
};