'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { ArrowLeft, Save, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PresetFormField,
  PresetFormInput,
  PresetFormSelect,
  PresetFormTextarea,
  PresetFormToggle,
} from './preset-dialog'
import { useProductionFilterSortPresets } from '@/lib/hooks/use-production-filter-sort-presets'
import { useProductionPageStylePresets } from '@/lib/hooks/use-production-page-style-presets'
import { useProductionEmailPresets } from '@/lib/hooks/use-production-email-presets'
import { useProductionPrintPresets } from '@/lib/hooks/use-production-print-presets'
import { useProductionId } from '@/components/production/production-provider'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { getSortFieldsForModule } from '@/lib/validation/preset-schemas'
import type { ModuleType, EmailMessagePreset, PrintPreset, FilterSortPreset, PageStylePreset } from '@/types'

function useSafeProductionId() {
  try {
    return useProductionId()
  } catch {
    return 'demo'
  }
}

interface PresetEditorProps {
  variant: 'email' | 'print'
  moduleType: ModuleType
  editingPreset?: EmailMessagePreset | PrintPreset | null
  onComplete: () => void
  onBack: () => void
}

const sortFieldLabels: Record<string, string> = {
  cue_number: 'Cue Number',
  channel: 'Channel',
  position: 'Position',
  department: 'Department',
  priority: 'Priority',
  type: 'Type',
  created_at: 'Date Created',
  completed_at: 'Date Completed',
  cancelled_at: 'Date Cancelled',
}

export function PresetEditor({
  variant,
  moduleType,
  editingPreset,
  onComplete,
  onBack,
}: PresetEditorProps) {
  const productionId = useSafeProductionId()

  const { savePreset: saveFilterPreset } = useProductionFilterSortPresets(moduleType)
  const { savePreset: savePageStylePreset } = useProductionPageStylePresets()
  const { savePreset: saveEmailPreset } = useProductionEmailPresets(moduleType)
  const { savePreset: savePrintPreset } = useProductionPrintPresets(moduleType)

  const { getPreset: getFilterPreset } = useFilterSortPresetsStore()
  const { presets: allPageStylePresets } = usePageStylePresetsStore()
  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()

  const availableTypes = useMemo(() => getTypes(moduleType), [moduleType, getTypes])
  const availablePriorities = useMemo(() => getPriorities(moduleType), [moduleType, getPriorities])
  const availableSortFields = useMemo(() => {
    const fields = getSortFieldsForModule(moduleType)
    return fields.map(field => ({ value: field, label: sortFieldLabels[field] || field }))
  }, [moduleType])

  // Resolve linked presets for editing
  const linkedFilterPreset = useMemo(() => {
    if (!editingPreset) return null
    const filterId = editingPreset.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.filterAndSortPresetId
      : (editingPreset as PrintPreset).config.filterSortPresetId
    return filterId ? getFilterPreset(filterId) : null
  }, [editingPreset, getFilterPreset])

  const linkedPageStylePreset = useMemo(() => {
    if (!editingPreset) return null
    const pageId = editingPreset.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.pageStylePresetId
      : (editingPreset as PrintPreset).config.pageStylePresetId
    return pageId ? allPageStylePresets.find(p => p.id === pageId) : null
  }, [editingPreset, allPageStylePresets])

  // Form state — initialized from editing preset + resolved linked presets
  const [presetName, setPresetName] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todo' | 'review' | 'complete' | 'cancelled' | ''>('todo')
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [priorityFilters, setPriorityFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('priority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [groupByType, setGroupByType] = useState(false)
  const [paperSize, setPaperSize] = useState<'letter' | 'a4' | 'legal'>('letter')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [includeCheckboxes, setIncludeCheckboxes] = useState(true)
  // Email-specific
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState(`{{PRODUCTION_TITLE}} - {{MODULE_NAME}} for {{CURRENT_DATE}}`)
  const [message, setMessage] = useState('')
  const [includeNotesInBody, setIncludeNotesInBody] = useState(true)
  const [attachPdf, setAttachPdf] = useState(true)

  // Initialize form from editing preset
  useEffect(() => {
    const types = getTypes(moduleType)
    const priorities = getPriorities(moduleType)

    if (editingPreset) {
      setPresetName(editingPreset.name)

      // Populate from linked filter preset
      if (linkedFilterPreset) {
        setStatusFilter(linkedFilterPreset.config.statusFilter || '')
        setTypeFilters(linkedFilterPreset.config.typeFilters)
        setPriorityFilters(linkedFilterPreset.config.priorityFilters)
        setSortBy(linkedFilterPreset.config.sortBy)
        setSortOrder(linkedFilterPreset.config.sortOrder)
        setGroupByType(linkedFilterPreset.config.groupByType)
      } else {
        setTypeFilters(types.map(t => t.value))
        setPriorityFilters(priorities.map(p => p.value))
      }

      // Populate from linked page style preset
      if (linkedPageStylePreset) {
        setPaperSize(linkedPageStylePreset.config.paperSize)
        setOrientation(linkedPageStylePreset.config.orientation)
        setIncludeCheckboxes(linkedPageStylePreset.config.includeCheckboxes)
      }

      // Email-specific fields
      if (editingPreset.type === 'email_message') {
        const email = editingPreset as EmailMessagePreset
        setRecipients(email.config.recipients)
        setSubject(email.config.subject)
        setMessage(email.config.message)
        setIncludeNotesInBody(email.config.includeNotesInBody)
        setAttachPdf(email.config.attachPdf)
      }
    } else {
      // Defaults for new preset
      setPresetName('')
      setStatusFilter('todo')
      setTypeFilters(types.map(t => t.value))
      setPriorityFilters(priorities.map(p => p.value))
      setSortBy('priority')
      setSortOrder('desc')
      setGroupByType(false)
      setPaperSize('letter')
      setOrientation('portrait')
      setIncludeCheckboxes(true)
      setRecipients('')
      setSubject(`{{PRODUCTION_TITLE}} - {{MODULE_NAME}} for {{CURRENT_DATE}}`)
      setMessage('')
      setIncludeNotesInBody(true)
      setAttachPdf(true)
    }
  // Only run on mount / when editingPreset changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPreset?.id])

  const canSave = useMemo(() => {
    if (!presetName.trim()) return false
    if (variant === 'email' && !subject.trim()) return false
    return true
  }, [presetName, subject, variant])

  const handleSave = useCallback(async () => {
    if (!canSave) return

    const newFilterId = `filter-sort-${Math.random().toString(36).substring(2, 11)}`
    const newPageStyleId = `page-style-${Math.random().toString(36).substring(2, 11)}`
    const timestamp = new Date()

    // 1. Create Filter/Sort Preset
    const filterPreset: FilterSortPreset = {
      id: newFilterId,
      type: 'filter_sort',
      moduleType,
      name: `Filter: ${presetName}`,
      productionId,
      config: {
        statusFilter: statusFilter || null,
        typeFilters,
        priorityFilters,
        sortBy,
        sortOrder,
        groupByType,
      },
      isDefault: false,
      createdBy: 'user',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await saveFilterPreset(filterPreset)

    // 2. Create Page Style Preset
    const pageStylePreset: PageStylePreset = {
      id: newPageStyleId,
      type: 'page_style',
      moduleType: 'all',
      name: `Style: ${presetName}`,
      productionId,
      config: {
        paperSize,
        orientation,
        includeCheckboxes,
      },
      isDefault: false,
      createdBy: 'user',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await savePageStylePreset(pageStylePreset)

    // 3. Create/update the main preset
    if (variant === 'email') {
      const config: EmailMessagePreset['config'] = {
        recipients,
        subject,
        message,
        filterAndSortPresetId: newFilterId,
        pageStylePresetId: newPageStyleId,
        includeNotesInBody,
        attachPdf,
      }

      if (editingPreset && editingPreset.type === 'email_message') {
        await saveEmailPreset({
          ...editingPreset,
          name: presetName,
          config: { ...editingPreset.config, ...config },
          updatedAt: new Date(),
        })
      } else {
        await saveEmailPreset({
          id: `email-${Math.random().toString(36).substring(2, 11)}`,
          productionId,
          type: 'email_message',
          moduleType,
          name: presetName,
          config,
          isDefault: false,
          createdBy: 'user',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    } else {
      const config: PrintPreset['config'] = {
        filterSortPresetId: newFilterId,
        pageStylePresetId: newPageStyleId,
      }

      if (editingPreset && editingPreset.type === 'print') {
        await savePrintPreset({
          ...editingPreset,
          name: presetName,
          config: { ...editingPreset.config, ...config },
          updatedAt: new Date(),
        })
      } else {
        await savePrintPreset({
          id: `print-${Math.random().toString(36).substring(2, 11)}`,
          productionId,
          type: 'print',
          moduleType,
          name: presetName,
          config,
          isDefault: false,
          createdBy: 'user',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }

    onComplete()
  }, [
    canSave, variant, moduleType, editingPreset, productionId, presetName,
    statusFilter, typeFilters, priorityFilters, sortBy, sortOrder, groupByType,
    paperSize, orientation, includeCheckboxes,
    recipients, subject, message, includeNotesInBody, attachPdf,
    saveFilterPreset, savePageStylePreset, saveEmailPreset, savePrintPreset,
    onComplete,
  ])

  const handleTypeToggle = (typeValue: string, checked: boolean) => {
    if (checked) {
      setTypeFilters(prev => [...prev, typeValue])
    } else {
      setTypeFilters(prev => prev.filter(t => t !== typeValue))
    }
  }

  const handlePriorityToggle = (priorityValue: string, checked: boolean) => {
    if (checked) {
      setPriorityFilters(prev => [...prev, priorityValue])
    } else {
      setPriorityFilters(prev => prev.filter(p => p !== priorityValue))
    }
  }

  return (
    <div className="flex flex-col h-full" data-testid="preset-editor">
      {/* Header */}
      <div className="pb-4 border-b border-bg-tertiary">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-bg-hover rounded transition-colors"
            data-testid="editor-back"
          >
            <ArrowLeft className="h-4 w-4 text-text-secondary" />
          </button>
          <h3 className="font-medium text-text-primary">
            {editingPreset ? 'Edit Preset' : 'New Preset'}
          </h3>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* Preset Name */}
        <PresetFormField label="Preset Name" required>
          <PresetFormInput
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="e.g., Daily Report"
            data-testid="editor-name"
          />
        </PresetFormField>

        {/* Filter & Sort Section */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Filter & Sort
          </div>

          <PresetFormField label="Status Filter">
            <PresetFormSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              data-testid="editor-status"
            >
              <option value="">All Statuses</option>
              <option value="todo">Todo Only</option>
              <option value="review">Review Only</option>
              <option value="complete">Complete Only</option>
              <option value="cancelled">Cancelled Only</option>
            </PresetFormSelect>
          </PresetFormField>

          {/* Type Filters */}
          <PresetFormField label="Type Filters">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTypeFilters(availableTypes.map(t => t.value))}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <CheckSquare className="h-3 w-3" />
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilters([])}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <Square className="h-3 w-3" />
                None
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {availableTypes.map((type) => (
                <label key={type.id} className="flex items-center gap-2 text-sm py-0.5">
                  <input
                    type="checkbox"
                    checked={typeFilters.includes(type.value)}
                    onChange={(e) => handleTypeToggle(type.value, e.target.checked)}
                    className="rounded"
                  />
                  <span className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-text-primary">{type.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </PresetFormField>

          {/* Priority Filters */}
          <PresetFormField label="Priority Filters">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPriorityFilters(availablePriorities.map(p => p.value))}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <CheckSquare className="h-3 w-3" />
                All
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilters([])}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <Square className="h-3 w-3" />
                None
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {availablePriorities.map((priority) => (
                <label key={priority.id} className="flex items-center gap-2 text-sm py-0.5">
                  <input
                    type="checkbox"
                    checked={priorityFilters.includes(priority.value)}
                    onChange={(e) => handlePriorityToggle(priority.value, e.target.checked)}
                    className="rounded"
                  />
                  <span className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: priority.color }}
                    />
                    <span className="text-text-primary">{priority.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </PresetFormField>

          {/* Sort */}
          <div className="grid grid-cols-2 gap-3">
            <PresetFormField label="Sort By">
              <PresetFormSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                data-testid="editor-sort-by"
              >
                {availableSortFields.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </PresetFormSelect>
            </PresetFormField>

            <PresetFormField label="Sort Order">
              <PresetFormSelect
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                data-testid="editor-sort-order"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </PresetFormSelect>
            </PresetFormField>
          </div>

          <PresetFormToggle
            checked={groupByType}
            onCheckedChange={setGroupByType}
            label="Group by Type"
            description="Group notes by their type before sorting"
          />
        </div>

        {/* Page Layout Section */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Page Layout
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PresetFormField label="Paper Size">
              <PresetFormSelect
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as typeof paperSize)}
                data-testid="editor-paper-size"
              >
                <option value="letter">Letter</option>
                <option value="a4">A4</option>
                <option value="legal">Legal</option>
              </PresetFormSelect>
            </PresetFormField>

            <PresetFormField label="Orientation">
              <PresetFormSelect
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as typeof orientation)}
                data-testid="editor-orientation"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </PresetFormSelect>
            </PresetFormField>
          </div>

          <PresetFormToggle
            checked={includeCheckboxes}
            onCheckedChange={setIncludeCheckboxes}
            label="Include Checkboxes"
            description="Add checkboxes next to each note"
          />
        </div>

        {/* Email Settings Section (email variant only) */}
        {variant === 'email' && (
          <div className="space-y-4">
            <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Email Settings
            </div>

            <PresetFormField label="Recipients">
              <PresetFormInput
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="user@example.com, user2@example.com"
                data-testid="editor-recipients"
              />
            </PresetFormField>

            <PresetFormField label="Subject" required>
              <PresetFormInput
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                data-testid="editor-subject"
              />
            </PresetFormField>

            <PresetFormField label="Message">
              <PresetFormTextarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Email message..."
                rows={3}
                data-testid="editor-message"
              />
            </PresetFormField>

            <PresetFormToggle
              checked={includeNotesInBody}
              onCheckedChange={setIncludeNotesInBody}
              label="Include Notes in Body"
              description="Include notes summary in the email body"
            />

            <PresetFormToggle
              checked={attachPdf}
              onCheckedChange={setAttachPdf}
              label="Attach PDF"
              description="Attach a PDF report to the email"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-bg-tertiary flex justify-between">
        <Button variant="outline" onClick={onBack} data-testid="editor-cancel-btn">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          data-testid="editor-save-btn"
        >
          <Save className="h-4 w-4 mr-2" />
          {editingPreset ? 'Update Preset' : 'Save Preset'}
        </Button>
      </div>
    </div>
  )
}
