import { WorkNotesPDFStrategy } from './WorkNotesPDFStrategy'

/**
 * Electrician Notes share the fixture-aware PDF layout with Work Notes.
 * Only the module title differs.
 */
export class ElectricianNotesPDFStrategy extends WorkNotesPDFStrategy {
  getModuleTitle(): string {
    return 'Electrician Notes'
  }
}
