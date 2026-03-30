'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, X, Package } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOrderItems } from '@/hooks/use-order-items'

interface OrderListSectionProps {
  noteId: string | null | undefined
  moduleType: 'work' | 'electrician'
}

export function OrderListSection({ noteId, moduleType }: OrderListSectionProps) {
  const { items, isLoading, addItem, removeItem, toggleOrdered } = useOrderItems(noteId)
  const [newItemName, setNewItemName] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accentColor = moduleType === 'electrician' ? 'text-cyan-400' : 'text-blue-400'
  const accentBorder = moduleType === 'electrician' ? 'border-cyan-400/30' : 'border-blue-400/30'

  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) return
    await addItem(newItemName.trim())
    setNewItemName('')
    inputRef.current?.focus()
  }, [newItemName, addItem])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleAddItem()
    }
  }, [handleAddItem])

  const orderedCount = items.filter(i => i.ordered).length
  const totalCount = items.length
  const hasItems = totalCount > 0

  // Show collapsed toggle if no items and not expanded
  if (!hasItems && !isExpanded && !isLoading) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsExpanded(true)
          setTimeout(() => inputRef.current?.focus(), 100)
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-muted-foreground/25 text-sm text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors w-full"
        data-testid="order-list-add-toggle"
      >
        <Plus className={cn('h-3.5 w-3.5', accentColor)} />
        Add order list
      </button>
    )
  }

  return (
    <div className={cn('rounded-md border border-dashed p-3 space-y-2', accentBorder)} data-testid="order-list-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-1.5 text-sm font-medium', accentColor)}>
          <Package className="h-3.5 w-3.5" />
          Order List
        </div>
        {hasItems && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {orderedCount} of {totalCount} ordered
          </span>
        )}
      </div>

      {/* Items */}
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center gap-2 py-1 group"
          data-testid={`order-item-${item.id}`}
        >
          <Checkbox
            checked={item.ordered}
            onCheckedChange={() => toggleOrdered(item.id)}
            data-testid={`order-item-checkbox-${item.id}`}
          />
          <span className={cn(
            'text-sm flex-1',
            item.ordered && 'line-through text-muted-foreground'
          )}>
            {item.name}
          </span>
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
            data-testid={`order-item-remove-${item.id}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {/* Add item input */}
      <div className="flex gap-2 pt-1">
        <Input
          ref={inputRef}
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add item..."
          className="h-8 text-sm"
          data-testid="order-list-add-input"
        />
        <Button
          type="button"
          size="sm"
          variant={moduleType}
          onClick={handleAddItem}
          disabled={!newItemName.trim()}
          className="h-8 px-3"
          data-testid="order-list-add-button"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}
