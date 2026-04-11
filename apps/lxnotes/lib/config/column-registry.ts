import type { ModuleType } from '@/types'

export interface ColumnMeta {
  id: string
  label: string
  canHide: boolean
}

/**
 * Column metadata registry per module.
 * Array order = default column order.
 * Column IDs must match the `id` or `accessorKey` in each module's column definitions.
 */
export const MODULE_COLUMN_REGISTRY: Record<ModuleType, ColumnMeta[]> = {
  cue: [
    { id: 'actions', label: 'Actions', canHide: false },
    { id: 'priority', label: 'Priority', canHide: true },
    { id: 'type', label: 'Type', canHide: true },
    { id: 'cueNumber', label: 'Cue #', canHide: true },
    { id: 'description', label: 'Note', canHide: false },
    { id: 'sceneryNeeds', label: 'Scenery Needs', canHide: true },
    { id: 'scriptLookup', label: 'Script Page', canHide: true },
    { id: 'createdBy', label: 'Who Created', canHide: true },
    { id: 'createdAt', label: 'Created', canHide: true },
    { id: 'completedBy', label: 'Who Completed', canHide: true },
    { id: 'completedAt', label: 'When Completed', canHide: true },
    { id: 'cancelledBy', label: 'Who Cancelled', canHide: true },
    { id: 'cancelledAt', label: 'When Cancelled', canHide: true },
    { id: 'reviewedBy', label: 'Who Reviewed', canHide: true },
    { id: 'reviewedAt', label: 'When Reviewed', canHide: true },
    { id: 'deletedByName', label: 'Who Deleted', canHide: true },
    { id: 'statusDeletedAt', label: 'When Deleted', canHide: true },
  ],
  work: [
    { id: 'actions', label: 'Actions', canHide: false },
    { id: 'priority', label: 'Priority', canHide: true },
    { id: 'type', label: 'Type', canHide: true },
    { id: 'channels', label: 'Channels', canHide: true },
    { id: 'fixtureTypes', label: 'Fixture Type', canHide: true },
    { id: 'purposes', label: 'Purpose', canHide: true },
    { id: 'positions', label: 'Position', canHide: true },
    { id: 'description', label: 'Note', canHide: false },
    { id: 'orders', label: 'Orders', canHide: true },
    { id: 'sceneryNeeds', label: 'Scenery Needs', canHide: true },
    { id: 'createdBy', label: 'Who Created', canHide: true },
    { id: 'createdAt', label: 'Created', canHide: true },
    { id: 'completedBy', label: 'Who Completed', canHide: true },
    { id: 'completedAt', label: 'When Completed', canHide: true },
    { id: 'cancelledBy', label: 'Who Cancelled', canHide: true },
    { id: 'cancelledAt', label: 'When Cancelled', canHide: true },
    { id: 'reviewedBy', label: 'Who Reviewed', canHide: true },
    { id: 'reviewedAt', label: 'When Reviewed', canHide: true },
    { id: 'deletedByName', label: 'Who Deleted', canHide: true },
    { id: 'statusDeletedAt', label: 'When Deleted', canHide: true },
  ],
  production: [
    { id: 'actions', label: 'Actions', canHide: false },
    { id: 'priority', label: 'Priority', canHide: true },
    { id: 'type', label: 'Type', canHide: true },
    { id: 'description', label: 'Note', canHide: false },
    { id: 'createdBy', label: 'Who Created', canHide: true },
    { id: 'createdAt', label: 'Created', canHide: true },
    { id: 'completedBy', label: 'Who Completed', canHide: true },
    { id: 'completedAt', label: 'When Completed', canHide: true },
    { id: 'cancelledBy', label: 'Who Cancelled', canHide: true },
    { id: 'cancelledAt', label: 'When Cancelled', canHide: true },
    { id: 'reviewedBy', label: 'Who Reviewed', canHide: true },
    { id: 'reviewedAt', label: 'When Reviewed', canHide: true },
    { id: 'deletedByName', label: 'Who Deleted', canHide: true },
    { id: 'statusDeletedAt', label: 'When Deleted', canHide: true },
  ],
  electrician: [
    { id: 'actions', label: 'Actions', canHide: false },
    { id: 'priority', label: 'Priority', canHide: true },
    { id: 'type', label: 'Type', canHide: true },
    { id: 'channels', label: 'Channels', canHide: true },
    { id: 'fixtureTypes', label: 'Fixture Type', canHide: true },
    { id: 'purposes', label: 'Purpose', canHide: true },
    { id: 'positions', label: 'Position', canHide: true },
    { id: 'description', label: 'Note', canHide: false },
    { id: 'orders', label: 'Orders', canHide: true },
    { id: 'sceneryNeeds', label: 'Scenery Needs', canHide: true },
    { id: 'createdBy', label: 'Who Created', canHide: true },
    { id: 'createdAt', label: 'Created', canHide: true },
    { id: 'completedBy', label: 'Who Completed', canHide: true },
    { id: 'completedAt', label: 'When Completed', canHide: true },
    { id: 'cancelledBy', label: 'Who Cancelled', canHide: true },
    { id: 'cancelledAt', label: 'When Cancelled', canHide: true },
    { id: 'reviewedBy', label: 'Who Reviewed', canHide: true },
    { id: 'reviewedAt', label: 'When Reviewed', canHide: true },
    { id: 'deletedByName', label: 'Who Deleted', canHide: true },
    { id: 'statusDeletedAt', label: 'When Deleted', canHide: true },
  ],
}

/** Get default column order for a module */
export function getDefaultColumnOrder(moduleType: ModuleType): string[] {
  return MODULE_COLUMN_REGISTRY[moduleType].map((c) => c.id)
}

/** Get column metadata by ID */
export function getColumnMeta(moduleType: ModuleType, columnId: string): ColumnMeta | undefined {
  return MODULE_COLUMN_REGISTRY[moduleType].find((c) => c.id === columnId)
}
