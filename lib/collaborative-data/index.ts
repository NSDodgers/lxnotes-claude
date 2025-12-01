/**
 * Collaborative Data Module
 *
 * Provides data and initialization for the Romeo & Juliet collaborative project.
 */

// Loader
export {
  initializeCollaborativeSession,
  resetCollaborativeSession,
} from './loader'

// Production data
export { ROMEO_JULIET_PRODUCTION } from './production/romeo-juliet-info'

// Notes data
export { RJ_CUE_NOTES, RJ_WORK_NOTES, RJ_PRODUCTION_NOTES } from './notes'
