'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InlineEditor } from '@/components/inline-editor'
import { ColorPicker } from '@/components/color-picker'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import type { ModuleType } from '@/types'

interface PrioritiesManagerProps {
  moduleType: ModuleType
  className?: string
}

export function PrioritiesManager({ moduleType, className }: PrioritiesManagerProps) {
  const {
    getSystemDefaults,
    getPriorities,
    addCustomPriority,
    updateCustomPriority,
    deleteCustomPriority,
    overrideSystemDefault,
    resetSystemOverride,
    systemOverrides
  } = useCustomPrioritiesStore()

  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newPriorityLabel, setNewPriorityLabel] = useState('')
  const [newPriorityColor, setNewPriorityColor] = useState('#D97706')
  const [newPrioritySortOrder, setNewPrioritySortOrder] = useState('')

  const systemDefaults = getSystemDefaults(moduleType)
  const allPriorities = getPriorities(moduleType)
  const customPriorities = allPriorities.filter(priority => !priority.isSystem)

  const getModuleDisplayName = (module: ModuleType) => {
    switch (module) {
      case 'cue': return 'Cue Notes'
      case 'work': return 'Work Notes'
      case 'production': return 'Production Notes'
    }
  }

  const getPriorityScaleInfo = (module: ModuleType) => {
    switch (module) {
      case 'work':
        return { scale: '1-9', description: 'Extended scale with 9 priority levels' }
      case 'cue':
      case 'production':
        return { scale: '1-5', description: 'Standard scale with 5 priority levels' }
      default:
        return { scale: '1-5', description: 'Standard scale' }
    }
  }

  const scaleInfo = getPriorityScaleInfo(moduleType)

  const isSystemPriorityCustomized = (systemId: string) => {
    return systemOverrides.some(
      override => override.moduleType === moduleType &&
        override.systemId === systemId &&
        override.type === 'priority'
    )
  }

  const isSystemPriorityHidden = (systemId: string) => {
    const override = systemOverrides.find(
      o => o.moduleType === moduleType && o.systemId === systemId && o.type === 'priority'
    )
    return override?.overrideData.isHidden || false
  }

  const handleSystemPriorityUpdate = (systemId: string, updates: { label?: string; color?: string }) => {
    overrideSystemDefault(moduleType, systemId, updates)
  }

  const handleSystemPriorityReset = (systemId: string) => {
    resetSystemOverride(moduleType, systemId)
  }

  const handleSystemPriorityToggleHidden = (systemId: string) => {
    const currentlyHidden = isSystemPriorityHidden(systemId)
    overrideSystemDefault(moduleType, systemId, { isHidden: !currentlyHidden })
  }

  const handleCustomPriorityUpdate = (priorityId: string, updates: { label?: string; color?: string }) => {
    updateCustomPriority(moduleType, priorityId, updates)
  }

  const handleCustomPriorityDelete = (priorityId: string) => {
    deleteCustomPriority(moduleType, priorityId)
  }

  const handleAddNewPriority = () => {
    if (newPriorityLabel.trim()) {
      const sortOrder = newPrioritySortOrder ? parseFloat(newPrioritySortOrder) : allPriorities.length + 1
      const value = newPriorityLabel.toLowerCase().replace(/\s+/g, '_')

      addCustomPriority(moduleType, {
        productionId: 'prod-1', // TODO: Replace with actual production ID
        moduleType,
        value,
        label: newPriorityLabel.trim(),
        color: newPriorityColor,
        sortOrder,
        isSystem: false,
        isHidden: false,
      })

      setNewPriorityLabel('')
      setNewPriorityColor('#D97706')
      setNewPrioritySortOrder('')
      setIsAddingNew(false)
    }
  }

  const handleCancelAddNew = () => {
    setNewPriorityLabel('')
    setNewPriorityColor('#D97706')
    setNewPrioritySortOrder('')
    setIsAddingNew(false)
  }

  const movePriority = (priorityId: string, direction: 'up' | 'down') => {
    const currentIndex = allPriorities.findIndex(p => p.id === priorityId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= allPriorities.length) return

    const currentPriority = allPriorities[currentIndex]
    const targetPriority = allPriorities[targetIndex]

    if (!currentPriority.isSystem) {
      // Moving custom priority - swap sort orders
      const newSortOrder = targetPriority.sortOrder
      updateCustomPriority(moduleType, priorityId, { sortOrder: newSortOrder })

      if (!targetPriority.isSystem) {
        updateCustomPriority(moduleType, targetPriority.id, { sortOrder: currentPriority.sortOrder })
      }
    }
  }

  return (
    <div className={cn('space-y-6', className)} data-testid="custom-priorities-manager">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {getModuleDisplayName(moduleType)} Priorities
            </h3>
            <p className="text-sm text-text-secondary">
              {scaleInfo.scale} Scale - {scaleInfo.description}
            </p>
          </div>
          <Button
            onClick={() => setIsAddingNew(true)}
            size="sm"
            className="flex items-center gap-2"
            data-testid="add-priority-button"
          >
            <Plus className="h-4 w-4" />
            Add Custom Priority
          </Button>
        </div>

        {/* System Default Priorities */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-secondary">System Defaults</h4>
          <div className="space-y-1">
            {systemDefaults.map((systemPriority, index) => (
              <div key={systemPriority.id} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-text-secondary bg-bg-tertiary rounded">
                  {systemPriority.sortOrder}
                </div>
                <div className="flex-1">
                  <InlineEditor
                    label={systemPriority.label}
                    color={systemPriority.color}
                    isSystem={true}
                    isCustomized={isSystemPriorityCustomized(systemPriority.id)}
                    isHidden={isSystemPriorityHidden(systemPriority.id)}
                    onSave={(updates) => handleSystemPriorityUpdate(systemPriority.id, updates)}
                    onReset={() => handleSystemPriorityReset(systemPriority.id)}
                    onToggleHidden={() => handleSystemPriorityToggleHidden(systemPriority.id)}
                    className="bg-transparent hover:bg-transparent p-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Priorities */}
        {(customPriorities.length > 0 || isAddingNew) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-secondary">Custom Priorities</h4>
            <div className="space-y-1">
              {customPriorities.map((customPriority, index) => (
                <div
                  key={customPriority.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-secondary transition-colors group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-text-secondary bg-bg-tertiary rounded">
                    {customPriority.sortOrder}
                  </div>
                  <div className="flex-1">
                    <InlineEditor
                      label={customPriority.label}
                      color={customPriority.color}
                      isSystem={false}
                      onSave={(updates) => handleCustomPriorityUpdate(customPriority.id, updates)}
                      className="bg-transparent hover:bg-transparent p-0"
                    />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => movePriority(customPriority.id, 'up')}
                      className="h-8 w-8 p-0"
                      title="Move up"
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => movePriority(customPriority.id, 'down')}
                      className="h-8 w-8 p-0"
                      title="Move down"
                      disabled={index === customPriorities.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCustomPriorityDelete(customPriority.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add new priority form */}
              {isAddingNew && (
                <div
                  className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary"
                  data-testid="priority-dialog"
                >
                  <Input
                    value={newPrioritySortOrder}
                    onChange={(e) => setNewPrioritySortOrder(e.target.value)}
                    placeholder="1.5"
                    className="w-16 text-xs"
                    title="Sort order (supports decimals for insertion between defaults)"
                    data-testid="priority-level"
                  />
                  <ColorPicker
                    value={newPriorityColor}
                    onChange={setNewPriorityColor}
                    className="flex-shrink-0"
                    data-testid="priority-color"
                  />
                  <Input
                    value={newPriorityLabel}
                    onChange={(e) => setNewPriorityLabel(e.target.value)}
                    placeholder="Enter priority name..."
                    className="flex-1"
                    data-testid="priority-name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNewPriority()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        handleCancelAddNew()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNewPriority}
                    disabled={!newPriorityLabel.trim()}
                    className="flex-shrink-0"
                    data-testid="save-button"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelAddNew}
                    className="flex-shrink-0"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {isAddingNew && (
              <div className="text-xs text-text-muted p-2 bg-bg-secondary rounded">
                <strong>Tip:</strong> Use decimal sort orders (e.g., 1.5, 2.3) to insert priorities between system defaults.
                Leave empty to append at the end.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}