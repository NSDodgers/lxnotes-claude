'use client'

import * as React from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      // All selected, deselect all
      onChange([])
    } else {
      // Not all selected, select all
      onChange(options.map(option => option.value))
    }
  }

  const handleSelectItem = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const isAllSelected = selected.length === options.length
  const isIndeterminate = selected.length > 0 && selected.length < options.length

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder
    }
    if (selected.length === options.length) {
      return 'All Types'
    }
    if (selected.length === 1) {
      const selectedOption = options.find(opt => opt.value === selected[0])
      return selectedOption?.label || selected[0]
    }
    return `${selected.length} types selected`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'justify-between bg-secondary text-secondary-foreground border-border hover:bg-secondary/80',
            className
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-64 overflow-auto">
          {/* All option */}
          <div className="flex items-center space-x-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b">
            <Checkbox
              id="select-all"
              checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
            >
              All Types
            </label>
          </div>
          
          {/* Individual options */}
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={() => handleSelectItem(option.value)}
            >
              <Checkbox
                id={option.value}
                checked={selected.includes(option.value)}
                onCheckedChange={() => handleSelectItem(option.value)}
              />
              <label
                htmlFor={option.value}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
        
        {/* Clear button */}
        {selected.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="w-full justify-start text-muted-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}