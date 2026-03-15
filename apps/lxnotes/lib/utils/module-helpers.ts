import type { ModuleType } from '@/types'

/**
 * Returns true for modules that use fixture/hookup data (channels, positions, etc.)
 */
export function isFixtureModule(moduleType: ModuleType): boolean {
  return moduleType === 'work' || moduleType === 'electrician'
}
