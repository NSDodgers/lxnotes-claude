'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

// Theater-optimized color palette - colors that work well in dark environments
const PRESET_COLORS = [
  // Reds
  '#DC2626', '#EF4444', '#F87171', '#FCA5A5',
  // Oranges
  '#EA580C', '#F97316', '#FB923C', '#FDBA74',
  // Yellows/Ambers
  '#D97706', '#F59E0B', '#FBBF24', '#FDE047',
  // Greens
  '#15803D', '#16A34A', '#22C55E', '#4ADE80',
  // Blues
  '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA',
  // Purples
  '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD',
  // Cyans/Teals
  '#0891B2', '#06B6D4', '#22D3EE', '#67E8F9',
  // Pinks
  '#BE185D', '#DB2777', '#EC4899', '#F472B6',
  // Grays
  '#374151', '#4B5563', '#6B7280', '#9CA3AF',
  // Special theatrical colors
  '#6A4C93', '#DB5461', '#F2CC8F', '#81B29A', 
  '#6E44FF', '#FF6B6B', '#B8D4E3', '#2E86AB',
  '#A23B72', '#73AB84', '#14B8A6', '#84CC16'
]

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value)
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetClick = (color: string) => {
    onChange(color)
    setCustomColor(color)
    setIsOpen(false)
  }

  const handleCustomColorSubmit = () => {
    if (customColor && customColor.match(/^#[0-9A-F]{6}$/i)) {
      onChange(customColor)
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-10 h-10 p-1 border-2 hover:border-border',
            className
          )}
          style={{ backgroundColor: value }}
          aria-label={`Color: ${value}`}
        >
          <div 
            className="w-full h-full rounded-xs border border-black/10"
            style={{ backgroundColor: value }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <div className="text-sm font-medium text-text-primary">
            Choose Color
          </div>
          
          {/* Preset color grid */}
          <div className="grid grid-cols-8 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handlePresetClick(color)}
                className={cn(
                  'w-8 h-8 rounded-xs border-2 hover:scale-110 transition-transform',
                  value === color ? 'border-text-primary' : 'border-border'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
          
          {/* Custom color input */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-text-secondary">
              Custom Color (HEX)
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value.toUpperCase())}
                placeholder="#FF0000"
                className="text-xs font-mono"
                maxLength={7}
              />
              <Button
                size="sm"
                onClick={handleCustomColorSubmit}
                disabled={!customColor.match(/^#[0-9A-F]{6}$/i)}
              >
                Apply
              </Button>
            </div>
          </div>
          
          {/* Color preview */}
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <div 
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono">{value}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}