'use client'

import { PresetFormField, PresetFormSelect, PresetFormToggle } from '@/components/preset-dialog'

type PaperSize = 'letter' | 'a4' | 'legal'
type Orientation = 'portrait' | 'landscape'

interface PageLayoutStepProps {
  paperSize: PaperSize
  orientation: Orientation
  includeCheckboxes: boolean
  onPaperSizeChange: (value: PaperSize) => void
  onOrientationChange: (value: Orientation) => void
  onIncludeCheckboxesChange: (value: boolean) => void
}

export function PageLayoutStep({
  paperSize,
  orientation,
  includeCheckboxes,
  onPaperSizeChange,
  onOrientationChange,
  onIncludeCheckboxesChange,
}: PageLayoutStepProps) {
  return (
    <div className="space-y-4" data-testid="wizard-step-page-layout">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Configure how your PDF will be formatted.
        </p>
      </div>

      <div className="space-y-4">
        <PresetFormField label="Paper Size" description="Choose the paper size for printing">
          <PresetFormSelect
            value={paperSize}
            onChange={(e) => onPaperSizeChange(e.target.value as PaperSize)}
            data-testid="wizard-paper-size-select"
          >
            <option value="letter">Letter (8.5&quot; × 11&quot;)</option>
            <option value="a4">A4 (210mm × 297mm)</option>
            <option value="legal">Legal (8.5&quot; × 14&quot;)</option>
          </PresetFormSelect>
        </PresetFormField>

        <PresetFormField label="Orientation" description="Page orientation">
          <PresetFormSelect
            value={orientation}
            onChange={(e) => onOrientationChange(e.target.value as Orientation)}
            data-testid="wizard-orientation-select"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </PresetFormSelect>
        </PresetFormField>

        <PresetFormToggle
          checked={includeCheckboxes}
          onCheckedChange={onIncludeCheckboxesChange}
          label="Include Checkboxes"
          description="Add checkboxes next to each note for manual tracking"
        />
      </div>
    </div>
  )
}
