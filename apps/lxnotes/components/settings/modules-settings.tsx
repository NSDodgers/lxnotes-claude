'use client'

import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarConfigStore, debouncedSaveToSupabase, immediateSaveToSupabase } from '@/lib/stores/sidebar-config-store'
import { getModuleConfig, getCombinedViewConfig } from '@/lib/config/modules'
import { useAuthContext } from '@/components/auth/auth-provider'
import { usePathname } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ModuleType } from '@/types'

interface SortableModuleRowProps {
  moduleId: ModuleType
  visible: boolean
  isLastVisible: boolean
  onToggleVisibility: (moduleId: ModuleType, visible: boolean) => void
}

function SortableModuleRow({ moduleId, visible, isLastVisible, onToggleVisibility }: SortableModuleRowProps) {
  const mod = getModuleConfig(moduleId)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: moduleId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!mod) return null

  const toggleDisabled = visible && isLastVisible

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg',
        isDragging ? 'opacity-50 shadow-lg z-10' : 'hover:bg-bg-tertiary',
        !visible && 'opacity-40',
        'transition-all duration-200'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary p-1"
        aria-label={`Move ${mod.label}. Use arrow keys to reorder.`}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-2 flex-1">
        <mod.icon className={cn('h-4 w-4', mod.colorClass)} />
        <span className={cn('text-sm font-medium', visible ? 'text-text-primary' : 'text-text-tertiary')}>
          {mod.label}
        </span>
      </div>
      <button
        onClick={() => onToggleVisibility(moduleId, !visible)}
        disabled={toggleDisabled}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          visible
            ? 'text-blue-400 hover:bg-blue-400/10'
            : 'text-text-tertiary hover:bg-bg-tertiary',
          toggleDisabled && 'opacity-30 cursor-not-allowed'
        )}
        aria-label={visible ? `Hide ${mod.label}` : `Show ${mod.label}`}
      >
        {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function ModulesSettings() {
  const { config, setModuleVisibility, reorderModules, setCombinedViewVisibility, resetToDefaults } = useSidebarConfigStore()
  const { user } = useAuthContext()
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')

  const userId = user?.id ?? null

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const visibleCount = config.modules.filter((m) => m.visible).length

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = config.modules.findIndex((m) => m.id === active.id)
      const newIndex = config.modules.findIndex((m) => m.id === over.id)
      reorderModules(oldIndex, newIndex)
      if (userId && !isDemoMode) {
        immediateSaveToSupabase(userId)
      }
    }
  }

  const handleToggleVisibility = (moduleId: ModuleType, visible: boolean) => {
    setModuleVisibility(moduleId, visible)
    if (userId && !isDemoMode) {
      debouncedSaveToSupabase(userId)
    }
  }

  const handleToggleCombinedView = (viewId: string, visible: boolean) => {
    setCombinedViewVisibility(viewId, visible)
    if (userId && !isDemoMode) {
      debouncedSaveToSupabase(userId)
    }
  }

  const handleReset = async () => {
    await resetToDefaults(isDemoMode ? null : userId)
  }

  return (
    <div className="space-y-6" aria-live="polite">
      {/* Module ordering */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-1">
          Sidebar Modules
        </h3>
        <p className="text-xs text-text-tertiary mb-3">
          Drag to reorder. Toggle eye to show/hide.
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={config.modules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {config.modules.map((entry) => (
                <SortableModuleRow
                  key={entry.id}
                  moduleId={entry.id}
                  visible={entry.visible}
                  isLastVisible={entry.visible && visibleCount <= 1}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-bg-tertiary" />

      {/* Combined views */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-1">
          Combined Views
        </h3>
        <p className="text-xs text-text-tertiary mb-3">
          Show notes from multiple modules in one view.
        </p>
        <div className="space-y-1.5">
          {config.combinedViews.map((entry) => {
            const view = getCombinedViewConfig(entry.id)
            if (!view) return null
            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg',
                  !entry.visible && 'opacity-40',
                  'transition-all duration-200'
                )}
              >
                <div className="flex items-center gap-2 flex-1">
                  <view.icon className={cn('h-4 w-4', view.colorClass)} />
                  <span className={cn('text-sm font-medium', entry.visible ? 'text-text-primary' : 'text-text-tertiary')}>
                    {view.label}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleCombinedView(entry.id, !entry.visible)}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    entry.visible
                      ? 'text-blue-400 hover:bg-blue-400/10'
                      : 'text-text-tertiary hover:bg-bg-tertiary'
                  )}
                  aria-label={entry.visible ? `Disable ${view.label}` : `Enable ${view.label}`}
                >
                  {entry.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
      >
        <RotateCcw className="h-3 w-3" />
        Reset to defaults
      </button>
    </div>
  )
}
