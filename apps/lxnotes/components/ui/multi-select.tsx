'use client'

import * as React from 'react'
import { Check, ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MultiSelectProps {
  options: { value: string; label: string; color?: string }[]
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
  const [searchQuery, setSearchQuery] = React.useState('')
  const [mounted, setMounted] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Prevent hydration mismatch from Radix UI ID generation
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    return options.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  const handleSelectAll = () => {
    const visibleOptions = filteredOptions
    const allVisibleSelected = visibleOptions.every(option => selected.includes(option.value))
    
    if (allVisibleSelected) {
      // All visible options selected, deselect them
      onChange(selected.filter(item => !visibleOptions.some(option => option.value === item)))
    } else {
      // Not all visible options selected, select all visible options
      const newSelected = [...selected]
      visibleOptions.forEach(option => {
        if (!newSelected.includes(option.value)) {
          newSelected.push(option.value)
        }
      })
      onChange(newSelected)
    }
  }

  const handleSelectItem = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  // Calculate selection state based on visible (filtered) options
  const visibleOptions = filteredOptions
  const visibleSelectedCount = visibleOptions.filter(option => selected.includes(option.value)).length
  const isAllVisibleSelected = visibleOptions.length > 0 && visibleSelectedCount === visibleOptions.length
  const isIndeterminateVisible = visibleSelectedCount > 0 && visibleSelectedCount < visibleOptions.length
  
  // Overall selection state for display
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

  // Auto-focus search input when dropdown opens
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [open])

  // Clear search when dropdown closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  // Handle keyboard events for search input
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('')
        e.stopPropagation()
      } else {
        setOpen(false)
      }
    }
  }

  // Render placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        role="combobox"
        aria-expanded={false}
        className={cn(
          'justify-between bg-secondary text-secondary-foreground border-border hover:bg-secondary/80',
          className
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
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
      <PopoverContent className="w-[240px] p-0" align="start">
        {/* Search input */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        
        <div className="max-h-64 overflow-auto">
          {/* All option - only show if we have visible options */}
          {visibleOptions.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b">
              <Checkbox
                id="select-all"
                checked={isAllVisibleSelected ? true : isIndeterminateVisible ? 'indeterminate' : false}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                {searchQuery ? `All Visible (${visibleOptions.length})` : 'All Types'}
              </label>
            </div>
          )}
          
          {/* Individual options */}
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
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
                {option.color && (
                  <div 
                    className="w-3 h-3 rounded-sm shrink-0" 
                    style={{ backgroundColor: option.color }} 
                  />
                )}
                <label
                  htmlFor={option.value}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {option.label}
                </label>
              </div>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No types found
            </div>
          )}
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