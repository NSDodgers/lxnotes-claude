---
task: m-implement-friendly-lightwright-display
branch: feature/implement-friendly-lightwright-display
status: pending
created: 2025-08-31
modules: [work-notes, lightwright-integration, components/notes-table, lib/services/lightwright-parser]
---

# Implement Friendly Lightwright Display Format

## Problem/Goal
When a work note contains multiple lightwright records that match the channel expression and has multiple items selected, the table display should convert the position and unit number into a friendly readable format. Currently the display is not user-friendly when dealing with multiple positions and unit numbers.

## Success Criteria
- [ ] Implement utility function in lightwright parser for position/unit grouping logic
- [ ] Handle single position with consecutive units (e.g., "DECK: #s 1-5" for channels 711-715)
- [ ] Handle single position with non-consecutive units (e.g., "DECK: #s 1, 3, 7-9")
- [ ] Handle multiple positions with sorting (e.g., "1E #11, Apron Truss DS #6, Box Boom SR #1")
- [ ] Implement alphabetical position sorting and numerical unit sorting within positions
- [ ] Add fallback format that shows raw data if friendly conversion fails
- [ ] Integrate friendly display into existing notes table component
- [ ] Test with various lightwright data scenarios to ensure robustness

## Context Manifest

### How Lightwright Integration Currently Works: Work Notes Position Display

The LX Notes application integrates with Lightwright CSV data to provide rich fixture information for work notes. When a user uploads Lightwright data, the system creates `LightwrightInfo` records containing detailed fixture data including channel, position, unit number, fixture type, and purpose. These fixtures can then be linked to work notes to provide context about which lighting equipment needs attention.

**Current Data Flow for Work Notes:**

When a work note is created, users can link it to multiple Lightwright fixtures through the `AddNoteDialog`. The system uses channel expressions like "1-5, 21, 45" to match fixtures by channel number. Once fixtures are linked, the `LightwrightStore` automatically generates aggregated data through the `updateAggregates` function, which creates an `LightwrightAggregate` object containing:

- `channels`: A formatted string like "1-5, 21, 45" 
- `positions`: An array of unique position names like ["DECK", "1E", "APRON TRUSS DS"]
- `fixtureTypes`: An array of fixture types like ["ETC Halcyon Titanium", "X4 BAR 20"]
- `purposes`: An array of purposes like ["SIDE ->", "BAX", "RAIL"]
- `universeAddresses`: An array of formatted universe/address pairs

The aggregation logic in `updateAggregates` currently performs straightforward deduplication - it extracts all unique values from the linked fixtures and stores them as arrays. The channel formatting uses the existing `formatChannelsAsExpression` utility that creates compact range notation (consecutive channels become "1-5", individual channels remain separate).

**Display in Notes Table:**

The work notes page (`app/work-notes/page.tsx`) displays lightwright data in a table through the `NotesTable` component. For work notes specifically, the table shows:

- Channels: Uses `LightwrightAggregateDisplay` with field="channels" 
- Type: Uses `LightwrightAggregateDisplay` with field="fixtureTypes", maxItems=2
- Purpose: Uses `LightwrightAggregateDisplay` with field="purposes", maxItems=2  
- Position: Uses `LightwrightAggregateDisplay` with field="positions", maxItems=2

The `LightwrightAggregateDisplay` component handles rendering each field type differently:

- **Channels**: Shows the formatted expression in monospace font (e.g. "1-5, 21, 45")
- **Arrays** (positions, types, purposes): Shows first `maxItems` as badges, with "+X more" indicator if truncated
- Includes inactive fixture warnings when `hasInactive` is true

**Current Position Display Problem:**

The position display currently shows raw position names as separate badges. For example, fixtures on "DECK" units 1-5 would show as a single "DECK" badge, losing the unit number information. The task requires implementing friendly formatting that combines position and unit data into readable descriptions like:

- Single position, consecutive units: "DECK: #s 1-5" 
- Single position, non-consecutive units: "DECK: #s 1, 3, 7-9"
- Multiple positions: "1E #11, Apron Truss DS #6, Box Boom SR #1"

**Sample Data Structure:**

Looking at the test data, fixtures have this structure:
- `position`: "DECK", "1E", "APRON TRUSS DS", "BOX BOOM SR", etc.
- `unitNumber`: "1", "2", "3", "11", etc. (stored as strings)
- `channel`: 711, 712, 713, etc. (stored as numbers)

Multiple fixtures can share the same position but have different unit numbers. The friendly display needs to group by position, then format unit numbers within each position using the same range logic as channels.

### For New Feature Implementation: Position/Unit Friendly Display

Since we're implementing a friendly display format for position and unit numbers, we need to extend the current lightwright aggregation and display system at several integration points:

The current `LightwrightStore.updateAggregates` function only captures unique position names in the `positions` array. We need to enhance this to also collect and structure the unit number data alongside the position data. This means modifying the aggregate data structure to include position-unit relationships rather than just position names.

The `LightwrightAggregateDisplay` component currently handles position display through the generic `renderArray` function which simply shows position names as badges. We need to add a new display mode specifically for position-unit combinations that can intelligently format them into readable strings.

The formatting logic should follow the existing pattern established by `formatChannelsAsExpression` in the lightwright store. This utility already handles range detection and formatting for consecutive numbers - we need similar logic but adapted for the position-unit context where we group by position first, then format unit ranges within each position.

The display should integrate seamlessly with the existing `LightwrightAggregateDisplay` props system, likely by adding a new field type or extending the positions field to handle the enhanced data structure. The component already supports `maxItems` truncation and inactive fixture warnings, so the new formatting should work within these constraints.

Since this is specifically for work notes display in the notes table, we need to ensure the enhanced display fits within the table cell constraints and doesn't break the responsive layout. The existing badge system provides a good foundation, but we may need to adjust how badges are formatted for the more complex position-unit strings.

### Technical Reference Details

#### Component Interfaces & Signatures

**LightwrightStore updateAggregates method:**
```typescript
updateAggregates: (workNoteId: string) => void
```

**LightwrightAggregateDisplay component:**
```typescript
interface LightwrightAggregateDisplayProps {
  aggregate: LightwrightAggregate | null
  field: 'channels' | 'positions' | 'fixtureTypes' | 'purposes' | 'universeAddresses'
  className?: string
  maxItems?: number
}
```

**Current LightwrightAggregate data structure:**
```typescript
interface LightwrightAggregate {
  workNoteId: string
  channels: string // "1-5, 21, 45"
  positions: string[] // ["DECK", "1E", "APRON TRUSS DS"]
  fixtureTypes: string[]
  purposes: string[]
  universeAddresses: string[]
  hasInactive: boolean
}
```

#### Data Structures

**LightwrightInfo (source data):**
```typescript
interface LightwrightInfo {
  id: string
  productionId: string
  lwid: string
  channel: number
  position: string      // "DECK", "1E", "APRON TRUSS DS"
  unitNumber: string    // "1", "2", "3", "11" (stored as strings)
  fixtureType: string
  purpose: string
  // ... other fields
}
```

**Existing channel formatting utility:**
```typescript
function formatChannelsAsExpression(channels: number[]): string
```

#### Configuration Requirements

No environment variables or config files need modification. This is purely a display enhancement that works with existing data structures.

#### File Locations

- **Primary implementation**: `/Users/nicksolyom/Documents/github/lxnotes-claude/lib/services/lightwright-parser.ts` - Add new utility function for position/unit formatting
- **Store integration**: `/Users/nicksolyom/Documents/github/lxnotes-claude/lib/stores/lightwright-store.ts` - Enhance updateAggregates to capture position-unit data
- **Display component**: `/Users/nicksolyom/Documents/github/lxnotes-claude/components/lightwright-aggregate-display.tsx` - Add position-unit display logic
- **Type definitions**: `/Users/nicksolyom/Documents/github/lxnotes-claude/types/index.ts` - Update LightwrightAggregate interface if needed
- **Notes table usage**: `/Users/nicksolyom/Documents/github/lxnotes-claude/components/notes-table.tsx` - Already correctly using the display component
- **Test data**: `/Users/nicksolyom/Documents/github/lxnotes-claude/lib/test-data/sample-lightwright-data.ts` - Contains realistic fixture data for testing

## User Notes
Example requirements:
- For channels 711-715 (position: Deck, units: 1,2,3,4,5) → "DECK: #s 1-5"
- For multiple positions → "1E #11, Apron Truss DS #6, Box Boom SR #1"
- Must accommodate any amount of various position and unit numbers
- Should work with work notes that span multiple positions
- Utility function approach preferred over display logic for reusability
- Include sorting: alphabetical positions, numerical units within positions
- Fallback to raw data if formatting fails

## Work Log
<!-- Updated as work progresses -->
- [2025-08-31] Task created, needs context gathering for lightwright integration patterns