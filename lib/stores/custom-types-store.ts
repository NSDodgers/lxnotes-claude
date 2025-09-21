import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomType, ModuleType, SystemOverride } from '@/types'

interface CustomTypesState {
  customTypes: Record<ModuleType, CustomType[]>
  systemOverrides: SystemOverride[]
  
  // System defaults per documentation
  getSystemDefaults: (moduleType: ModuleType) => CustomType[]
  
  // Get merged types (system + custom + overrides)
  getTypes: (moduleType: ModuleType) => CustomType[]
  
  // CRUD operations
  addCustomType: (moduleType: ModuleType, type: Omit<CustomType, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCustomType: (moduleType: ModuleType, id: string, updates: Partial<CustomType>) => void
  deleteCustomType: (moduleType: ModuleType, id: string) => void
  
  // System override operations
  overrideSystemDefault: (moduleType: ModuleType, systemId: string, overrideData: SystemOverride['overrideData']) => void
  resetSystemOverride: (moduleType: ModuleType, systemId: string) => void
  
  // Reordering
  reorderTypes: (moduleType: ModuleType, orderedIds: string[]) => void
}

// System defaults per documentation
const getSystemDefaults = (moduleType: ModuleType): CustomType[] => {
  const baseDate = new Date()
  const productionId = 'prod-1' // TODO: Replace with actual production ID
  
  switch (moduleType) {
    case 'cue':
      return [
        { id: 'sys-cue-1', productionId, moduleType, value: 'cue', label: 'Cue', color: '#2563EB', isSystem: true, isHidden: false, sortOrder: 1, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-2', productionId, moduleType, value: 'director', label: 'Director', color: '#B91C1C', isSystem: true, isHidden: false, sortOrder: 2, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-3', productionId, moduleType, value: 'choreographer', label: 'Choreographer', color: '#15803D', isSystem: true, isHidden: false, sortOrder: 3, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-4', productionId, moduleType, value: 'designer', label: 'Designer', color: '#B45309', isSystem: true, isHidden: false, sortOrder: 4, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-5', productionId, moduleType, value: 'stage_manager', label: 'Stage Manager', color: '#6D28D9', isSystem: true, isHidden: false, sortOrder: 5, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-6', productionId, moduleType, value: 'associate', label: 'Associate', color: '#0E7490', isSystem: true, isHidden: false, sortOrder: 6, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-7', productionId, moduleType, value: 'assistant', label: 'Assistant', color: '#BE185D', isSystem: true, isHidden: false, sortOrder: 7, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-8', productionId, moduleType, value: 'spot', label: 'Spot', color: '#C2410C', isSystem: true, isHidden: false, sortOrder: 8, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-9', productionId, moduleType, value: 'programmer', label: 'Programmer', color: '#4338CA', isSystem: true, isHidden: false, sortOrder: 9, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-10', productionId, moduleType, value: 'production', label: 'Production', color: '#4B5563', isSystem: true, isHidden: false, sortOrder: 10, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-11', productionId, moduleType, value: 'paperwork', label: 'Paperwork', color: '#4D7C0F', isSystem: true, isHidden: false, sortOrder: 11, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-cue-12', productionId, moduleType, value: 'think', label: 'Think', color: '#0F766E', isSystem: true, isHidden: false, sortOrder: 12, createdAt: baseDate, updatedAt: baseDate },
      ]
    
    case 'production':
      return [
        { id: 'sys-prod-1', productionId, moduleType, value: 'scenic', label: 'Scenic', color: '#4C366D', isSystem: true, isHidden: false, sortOrder: 1, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-2', productionId, moduleType, value: 'costumes', label: 'Costumes', color: '#9F1239', isSystem: true, isHidden: false, sortOrder: 2, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-3', productionId, moduleType, value: 'lighting', label: 'Lighting', color: '#B45309', isSystem: true, isHidden: false, sortOrder: 3, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-4', productionId, moduleType, value: 'props', label: 'Props', color: '#5B8767', isSystem: true, isHidden: false, sortOrder: 4, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-5', productionId, moduleType, value: 'sound', label: 'Sound', color: '#4C1D95', isSystem: true, isHidden: false, sortOrder: 5, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-6', productionId, moduleType, value: 'video', label: 'Video', color: '#B91C1C', isSystem: true, isHidden: false, sortOrder: 6, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-7', productionId, moduleType, value: 'stage_management', label: 'Stage Management', color: '#6B7280', isSystem: true, isHidden: false, sortOrder: 7, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-8', productionId, moduleType, value: 'directing', label: 'Directing', color: '#1E5E8E', isSystem: true, isHidden: false, sortOrder: 8, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-9', productionId, moduleType, value: 'choreography', label: 'Choreography', color: '#7E1E53', isSystem: true, isHidden: false, sortOrder: 9, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-prod-10', productionId, moduleType, value: 'production_management', label: 'Production Management', color: '#4D7C5A', isSystem: true, isHidden: false, sortOrder: 10, createdAt: baseDate, updatedAt: baseDate },
      ]
    
    case 'work':
      return [
        { id: 'sys-work-1', productionId, moduleType, value: 'work', label: 'Work', color: '#4B5563', isSystem: true, isHidden: false, sortOrder: 1, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-2', productionId, moduleType, value: 'focus', label: 'Focus', color: '#991B1B', isSystem: true, isHidden: false, sortOrder: 2, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-3', productionId, moduleType, value: 'paperwork', label: 'Paperwork', color: '#1E3A8A', isSystem: true, isHidden: false, sortOrder: 3, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-4', productionId, moduleType, value: 'electrician', label: 'Electrician', color: '#047857', isSystem: true, isHidden: false, sortOrder: 4, createdAt: baseDate, updatedAt: baseDate },
        { id: 'sys-work-5', productionId, moduleType, value: 'think', label: 'Think', color: '#92400E', isSystem: true, isHidden: false, sortOrder: 5, createdAt: baseDate, updatedAt: baseDate },
      ]
    
    default:
      return []
  }
}

export const useCustomTypesStore = create<CustomTypesState>()(
  persist(
    (set, get) => ({
      customTypes: {
        cue: [],
        work: [],
        production: []
      },
      systemOverrides: [],
      
      getSystemDefaults: (moduleType: ModuleType) => {
        return getSystemDefaults(moduleType)
      },
      
      getTypes: (moduleType: ModuleType) => {
        const systemDefaults = getSystemDefaults(moduleType)
        const customTypes = get().customTypes[moduleType] || []
        const overrides = get().systemOverrides.filter(o => o.moduleType === moduleType && o.type === 'type')
        
        // Apply overrides to system defaults
        const modifiedSystemDefaults = systemDefaults.map(sysType => {
          const override = overrides.find(o => o.systemId === sysType.id)
          if (override) {
            return {
              ...sysType,
              label: override.overrideData.label || sysType.label,
              color: override.overrideData.color || sysType.color,
              isHidden: override.overrideData.isHidden ?? sysType.isHidden,
            }
          }
          return sysType
        }).filter(type => !type.isHidden)
        
        // Merge and sort
        const allTypes = [...modifiedSystemDefaults, ...customTypes]
        return allTypes.sort((a, b) => a.sortOrder - b.sortOrder)
      },
      
      addCustomType: (moduleType: ModuleType, typeData) => {
        const timestamp = new Date()
        const newType: CustomType = {
          ...typeData,
          id: `custom-${typeData.value}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        
        set(state => ({
          customTypes: {
            ...state.customTypes,
            [moduleType]: [...(state.customTypes[moduleType] || []), newType]
          }
        }))
      },
      
      updateCustomType: (moduleType: ModuleType, id: string, updates) => {
        set(state => ({
          customTypes: {
            ...state.customTypes,
            [moduleType]: state.customTypes[moduleType].map(type =>
              type.id === id
                ? { ...type, ...updates, updatedAt: new Date() }
                : type
            )
          }
        }))
      },
      
      deleteCustomType: (moduleType: ModuleType, id: string) => {
        set(state => ({
          customTypes: {
            ...state.customTypes,
            [moduleType]: state.customTypes[moduleType].filter(type => type.id !== id)
          }
        }))
      },
      
      overrideSystemDefault: (moduleType: ModuleType, systemId: string, overrideData) => {
        set(state => {
          const existingOverrideIndex = state.systemOverrides.findIndex(
            o => o.moduleType === moduleType && o.systemId === systemId && o.type === 'type'
          )
          
          const timestamp = new Date()
          const newOverride: SystemOverride = {
            id: `override-${systemId}-${Math.random().toString(36).substr(2, 9)}`,
            productionId: 'prod-1', // TODO: Replace with actual production ID
            moduleType,
            systemId,
            type: 'type',
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
            o => !(o.moduleType === moduleType && o.systemId === systemId && o.type === 'type')
          )
        }))
      },
      
      reorderTypes: (moduleType: ModuleType, orderedIds: string[]) => {
        set(state => ({
          customTypes: {
            ...state.customTypes,
            [moduleType]: state.customTypes[moduleType].map(type => {
              const newIndex = orderedIds.indexOf(type.id)
              return newIndex >= 0 ? { ...type, sortOrder: newIndex + 1 } : type
            })
          }
        }))
      },
    }),
    {
      name: 'custom-types-storage',
      skipHydration: true,
    }
  )
)