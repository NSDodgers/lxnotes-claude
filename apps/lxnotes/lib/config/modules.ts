import { Lightbulb, Wrench, Zap, FileText, Layers } from 'lucide-react'
import type { ComponentType } from 'react'
import type { ModuleType } from '@/types'

export interface ModuleConfig {
  id: ModuleType
  label: string
  icon: ComponentType<{ className?: string }>
  colorClass: string
  route: string
}

export interface CombinedViewConfig {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  colorClass: string
  route: string
  moduleTypes: ModuleType[]
}

export const MODULE_REGISTRY: ModuleConfig[] = [
  { id: 'cue', label: 'Cue Notes', icon: Lightbulb, colorClass: 'text-modules-cue', route: '/cue-notes' },
  { id: 'work', label: 'Work Notes', icon: Wrench, colorClass: 'text-modules-work', route: '/work-notes' },
  { id: 'electrician', label: 'Electrician Notes', icon: Zap, colorClass: 'text-modules-electrician', route: '/electrician-notes' },
  { id: 'production', label: 'Production Notes', icon: FileText, colorClass: 'text-modules-production', route: '/production-notes' },
]

export const COMBINED_VIEW_REGISTRY: CombinedViewConfig[] = [
  {
    id: 'work-electrician',
    label: 'Work + Electrician Notes',
    icon: Layers,
    colorClass: 'text-teal-400',
    route: '/combined/work-electrician',
    moduleTypes: ['work', 'electrician'],
  },
]

/** Default module order (all visible) */
export const DEFAULT_MODULE_ORDER = MODULE_REGISTRY.map((m) => m.id)

/** Look up a module config by id */
export function getModuleConfig(id: ModuleType): ModuleConfig | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id)
}

/** Look up a combined view config by id */
export function getCombinedViewConfig(id: string): CombinedViewConfig | undefined {
  return COMBINED_VIEW_REGISTRY.find((v) => v.id === id)
}
