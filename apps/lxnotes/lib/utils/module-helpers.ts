import type { ModuleType, PresetModuleType } from '@/types'

/**
 * Returns true for modules that use fixture/hookup data (channels, positions, etc.)
 */
export function isFixtureModule(moduleType: ModuleType | PresetModuleType): boolean {
  return moduleType === 'work' || moduleType === 'electrician' || moduleType === 'combined-work-electrician'
}

/**
 * Returns the ModuleType to use for PDF column generation.
 * Combined views use 'work' columns since work+electrician share the same schema.
 */
export function getPdfModuleType(moduleType: PresetModuleType): ModuleType {
  if (moduleType === 'combined-work-electrician') return 'work'
  return moduleType
}

/**
 * Returns the constituent ModuleTypes for a PresetModuleType.
 * Regular modules return a single-element array. Combined views return multiple.
 */
export function getConstituentModuleTypes(moduleType: PresetModuleType): ModuleType[] {
  if (moduleType === 'combined-work-electrician') return ['work', 'electrician']
  return [moduleType]
}
