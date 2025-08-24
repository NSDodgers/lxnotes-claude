'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InlineEditor } from '@/components/inline-editor'
import { ColorPicker } from '@/components/color-picker'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { Plus, Trash2 } from 'lucide-react'
import type { ModuleType } from '@/types'

interface TypesManagerProps {
  moduleType: ModuleType
  className?: string
}

export function TypesManager({ moduleType, className }: TypesManagerProps) {
  const {
    getSystemDefaults,
    getTypes,
    addCustomType,
    updateCustomType,
    deleteCustomType,
    overrideSystemDefault,
    resetSystemOverride,
    systemOverrides
  } = useCustomTypesStore()

  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [newTypeColor, setNewTypeColor] = useState('#6B7280')

  const systemDefaults = getSystemDefaults(moduleType)
  const allTypes = getTypes(moduleType)
  const customTypes = allTypes.filter(type => !type.isSystem)

  const getModuleDisplayName = (module: ModuleType) => {
    switch (module) {
      case 'cue': return 'Cue Notes'
      case 'work': return 'Work Notes'
      case 'production': return 'Production Notes'
    }
  }

  const isSystemTypeCustomized = (systemId: string) => {
    return systemOverrides.some(
      override => override.moduleType === moduleType && 
                 override.systemId === systemId && 
                 override.type === 'type'
    )
  }

  const isSystemTypeHidden = (systemId: string) => {
    const override = systemOverrides.find(
      o => o.moduleType === moduleType && o.systemId === systemId && o.type === 'type'
    )
    return override?.overrideData.isHidden || false
  }

  const handleSystemTypeUpdate = (systemId: string, updates: { label?: string; color?: string }) => {
    overrideSystemDefault(moduleType, systemId, updates)
  }

  const handleSystemTypeReset = (systemId: string) => {
    resetSystemOverride(moduleType, systemId)
  }

  const handleSystemTypeToggleHidden = (systemId: string) => {
    const currentlyHidden = isSystemTypeHidden(systemId)
    overrideSystemDefault(moduleType, systemId, { isHidden: !currentlyHidden })
  }

  const handleCustomTypeUpdate = (typeId: string, updates: { label?: string; color?: string }) => {
    updateCustomType(moduleType, typeId, updates)
  }

  const handleCustomTypeDelete = (typeId: string) => {
    deleteCustomType(moduleType, typeId)
  }

  const handleAddNewType = () => {
    if (newTypeLabel.trim()) {
      const value = newTypeLabel.toLowerCase().replace(/\s+/g, '_')
      addCustomType(moduleType, {
        productionId: 'prod-1', // TODO: Replace with actual production ID
        moduleType,
        value,
        label: newTypeLabel.trim(),
        color: newTypeColor,
        isSystem: false,
        isHidden: false,
        sortOrder: allTypes.length + 1,
      })
      setNewTypeLabel('')
      setNewTypeColor('#6B7280')
      setIsAddingNew(false)
    }
  }

  const handleCancelAddNew = () => {
    setNewTypeLabel('')
    setNewTypeColor('#6B7280')
    setIsAddingNew(false)
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">
            {getModuleDisplayName(moduleType)} Types
          </h3>
          <Button
            onClick={() => setIsAddingNew(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Type
          </Button>
        </div>

        {/* System Default Types */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-secondary">System Defaults</h4>
          <div className="space-y-1">
            {systemDefaults.map((systemType) => (
              <InlineEditor
                key={systemType.id}
                label={systemType.label}
                color={systemType.color}
                isSystem={true}
                isCustomized={isSystemTypeCustomized(systemType.id)}
                isHidden={isSystemTypeHidden(systemType.id)}
                onSave={(updates) => handleSystemTypeUpdate(systemType.id, updates)}
                onReset={() => handleSystemTypeReset(systemType.id)}
                onToggleHidden={() => handleSystemTypeToggleHidden(systemType.id)}
              />
            ))}
          </div>
        </div>

        {/* Custom Types */}
        {(customTypes.length > 0 || isAddingNew) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-secondary">Custom Types</h4>
            <div className="space-y-1">
              {customTypes.map((customType) => (
                <div
                  key={customType.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-secondary transition-colors group"
                >
                  <div className="flex-1">
                    <InlineEditor
                      label={customType.label}
                      color={customType.color}
                      isSystem={false}
                      onSave={(updates) => handleCustomTypeUpdate(customType.id, updates)}
                      className="bg-transparent hover:bg-transparent p-0"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCustomTypeDelete(customType.id)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add new type form */}
              {isAddingNew && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary">
                  <ColorPicker
                    value={newTypeColor}
                    onChange={setNewTypeColor}
                    className="flex-shrink-0"
                  />
                  <Input
                    value={newTypeLabel}
                    onChange={(e) => setNewTypeLabel(e.target.value)}
                    placeholder="Enter type name..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNewType()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        handleCancelAddNew()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNewType}
                    disabled={!newTypeLabel.trim()}
                    className="flex-shrink-0"
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
          </div>
        )}
      </div>
    </div>
  )
}