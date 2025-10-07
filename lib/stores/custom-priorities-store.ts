import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import type { CustomPriority, ModuleType, SystemOverride } from '@/types'

interface CustomPrioritiesState {
  customPriorities: Record<ModuleType, CustomPriority[]>
  systemOverrides: SystemOverride[]
  
  // System defaults per documentation
  getSystemDefaults: (moduleType: ModuleType) => CustomPriority[]
  
  // Get merged priorities (system + custom + overrides)
  getPriorities: (moduleType: ModuleType) => CustomPriority[]
  
  // CRUD operations
  addCustomPriority: (moduleType: ModuleType, priority: Omit<CustomPriority, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCustomPriority: (moduleType: ModuleType, id: string, updates: Partial<CustomPriority>) => void
  deleteCustomPriority: (moduleType: ModuleType, id: string) => void
  
  // System override operations
  overrideSystemDefault: (moduleType: ModuleType, systemId: string, overrideData: SystemOverride['overrideData']) => void
  resetSystemOverride: (moduleType: ModuleType, systemId: string) => void
  
  // Reordering with decimal support
  reorderPriorities: (moduleType: ModuleType, orderedIds: string[]) => void
  insertPriorityBetween: (moduleType: ModuleType, priority: Omit<CustomPriority, 'id' | 'createdAt' | 'updatedAt'>, beforeId: string, afterId: string) => void
}

// System defaults per documentation
const getSystemDefaults = (moduleType: ModuleType): CustomPriority[] => {
  const baseDate = new Date()
  const productionId = 'prod-1' // TODO: Replace with actual production ID
  
  switch (moduleType) {
    case 'cue':
    case 'production':
      // 1-5 scale for Cue and Production modules
      return [
        { id: 'sys-pri-1', productionId, moduleType, value: 'critical', label: 'Critical', color: '#DC2626', sortOrder: 1, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-pri-2', productionId, moduleType, value: 'very_high', label: 'Very High', color: '#EA580C', sortOrder: 2, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-pri-3', productionId, moduleType, value: 'medium', label: 'Medium', color: '#D97706', sortOrder: 3, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-pri-4', productionId, moduleType, value: 'low', label: 'Low', color: '#65A30D', sortOrder: 4, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-pri-5', productionId, moduleType, value: 'very_low', label: 'Very Low', color: '#16A34A', sortOrder: 5, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
      ]
    
    case 'work':
      // Extended 1-9 scale for Work module
      return [
        { id: 'sys-work-pri-1', productionId, moduleType, value: 'critical', label: 'Critical', color: '#DC2626', sortOrder: 1, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-pri-2', productionId, moduleType, value: 'very_high', label: 'Very High', color: '#EA580C', sortOrder: 2, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-pri-3', productionId, moduleType, value: 'high', label: 'High', color: '#F59E0B', sortOrder: 3, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-pri-4', productionId, moduleType, value: 'medium_high', label: 'Medium High', color: '#EAB308', sortOrder: 4, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-pri-5', productionId, moduleType, value: 'medium', label: 'Medium', color: '#D97706', sortOrder: 5, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-pri-6', productionId, moduleType, value: 'medium_low', label: 'Medium Low', color: '#84CC16', sortOrder: 6, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-pri-7', productionId, moduleType, value: 'low', label: 'Low', color: '#65A30D', sortOrder: 7, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-pri-8', productionId, moduleType, value: 'very_low', label: 'Very Low', color: '#16A34A', sortOrder: 8, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-pri-9', productionId, moduleType, value: 'uncritical', label: 'Uncritical', color: '#22C55E', sortOrder: 9, isSystem: true, isHidden: false, createdAt: baseDate, updatedAt: baseDate },
      ]
    
    default:
      return []
  }
}

// Check if we're in demo mode
const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export const useCustomPrioritiesStore = create<CustomPrioritiesState>()(
  persist(
    (set, get) => ({
      customPriorities: {
        cue: [],
        work: [],
        production: []
      },
      systemOverrides: [],
      
      getSystemDefaults: (moduleType: ModuleType) => {
        return getSystemDefaults(moduleType)
      },
      
      getPriorities: (moduleType: ModuleType) => {
        const systemDefaults = getSystemDefaults(moduleType)
        const customPriorities = get().customPriorities[moduleType] || []
        const overrides = get().systemOverrides.filter(o => o.moduleType === moduleType && o.type === 'priority')
        
        // Apply overrides to system defaults
        const modifiedSystemDefaults = systemDefaults.map(sysPriority => {
          const override = overrides.find(o => o.systemId === sysPriority.id)
          if (override) {
            return {
              ...sysPriority,
              label: override.overrideData.label || sysPriority.label,
              color: override.overrideData.color || sysPriority.color,
              isHidden: override.overrideData.isHidden ?? sysPriority.isHidden,
            }
          }
          return sysPriority
        }).filter(priority => !priority.isHidden)
        
        // Merge and sort by sortOrder (supports decimals)
        const allPriorities = [...modifiedSystemDefaults, ...customPriorities]
        return allPriorities.sort((a, b) => a.sortOrder - b.sortOrder)
      },
      
      addCustomPriority: (moduleType: ModuleType, priorityData) => {
        const timestamp = new Date()
        const newPriority: CustomPriority = {
          ...priorityData,
          id: `custom-pri-${priorityData.value}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        
        set(state => ({
          customPriorities: {
            ...state.customPriorities,
            [moduleType]: [...(state.customPriorities[moduleType] || []), newPriority]
          }
        }))
      },
      
      updateCustomPriority: (moduleType: ModuleType, id: string, updates) => {
        set(state => ({
          customPriorities: {
            ...state.customPriorities,
            [moduleType]: state.customPriorities[moduleType].map(priority =>
              priority.id === id
                ? { ...priority, ...updates, updatedAt: new Date() }
                : priority
            )
          }
        }))
      },
      
      deleteCustomPriority: (moduleType: ModuleType, id: string) => {
        set(state => ({
          customPriorities: {
            ...state.customPriorities,
            [moduleType]: state.customPriorities[moduleType].filter(priority => priority.id !== id)
          }
        }))
      },
      
      overrideSystemDefault: (moduleType: ModuleType, systemId: string, overrideData) => {
        set(state => {
          const existingOverrideIndex = state.systemOverrides.findIndex(
            o => o.moduleType === moduleType && o.systemId === systemId && o.type === 'priority'
          )
          
          const timestamp = new Date()
          const newOverride: SystemOverride = {
            id: `override-pri-${systemId}-${Math.random().toString(36).substr(2, 9)}`,
            productionId: 'prod-1', // TODO: Replace with actual production ID
            moduleType,
            systemId,
            type: 'priority',
            overrideData,
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          
          if (existingOverrideIndex >= 0) {
            // Update existing override
            const updatedOverrides = [...state.systemOverrides]
            updatedOverrides[existingOverrideIndex] = {
              ...updatedOverrides[existingOverrideIndex],
              overrideData,
              updatedAt: new Date()
            }
            return { systemOverrides: updatedOverrides }
          } else {
            // Add new override
            return { systemOverrides: [...state.systemOverrides, newOverride] }
          }
        })
      },
      
      resetSystemOverride: (moduleType: ModuleType, systemId: string) => {
        set(state => ({
          systemOverrides: state.systemOverrides.filter(
            o => !(o.moduleType === moduleType && o.systemId === systemId && o.type === 'priority')
          )
        }))
      },
      
      reorderPriorities: (moduleType: ModuleType, orderedIds: string[]) => {
        set(state => ({
          customPriorities: {
            ...state.customPriorities,
            [moduleType]: state.customPriorities[moduleType].map(priority => {
              const newIndex = orderedIds.indexOf(priority.id)
              return newIndex >= 0 ? { ...priority, sortOrder: newIndex + 1 } : priority
            })
          }
        }))
      },
      
      insertPriorityBetween: (moduleType: ModuleType, priorityData, beforeId: string, afterId: string) => {
        const allPriorities = get().getPriorities(moduleType)
        const beforePriority = allPriorities.find(p => p.id === beforeId)
        const afterPriority = allPriorities.find(p => p.id === afterId)
        
        if (!beforePriority || !afterPriority) return
        
        // Calculate decimal sort order between the two priorities
        const newSortOrder = (beforePriority.sortOrder + afterPriority.sortOrder) / 2
        
        const timestamp = new Date()
        const newPriority: CustomPriority = {
          ...priorityData,
          id: `custom-pri-${priorityData.value}-${Math.random().toString(36).substr(2, 9)}`,
          sortOrder: newSortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        
        set(state => ({
          customPriorities: {
            ...state.customPriorities,
            [moduleType]: [...(state.customPriorities[moduleType] || []), newPriority]
          }
        }))
      },
    }),
    {
      name: 'custom-priorities-storage',
      storage: createJSONStorage(() =>
        createSafeStorage(
          'custom-priorities-storage',
          isDemoMode() ? 'session' : 'local'
        )
      ),
      skipHydration: true,
    }
  )
)
