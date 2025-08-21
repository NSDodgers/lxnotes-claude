# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (runs on localhost:3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture Overview

This is **LX Notes**, a theatrical production notes management system built with Next.js 15 and TypeScript. The app manages three distinct note modules for theater lighting and production teams.

### Core Architecture

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with dark theme as default
- **State Management**: Zustand for client state
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (with mock client for development)

### Module Structure

The app is organized around three core modules:

1. **Cue Notes** (`/cue-notes`) - Purple theme
   - Lighting cues and effects management
   - Links to script pages and scenes/songs
   - Uses `scriptPageId` and `sceneSongId` fields

2. **Work Notes** (`/work-notes`) - Blue theme  
   - Equipment and technical task tracking
   - Lightwright CSV data integration
   - Uses `lightwrightItemId` field

3. **Production Notes** (`/production-notes`) - Cyan theme
   - Cross-department communication
   - No external lookups required

### Key Data Models

All notes share common fields defined in `types/index.ts`:
- `moduleType`: 'cue' | 'work' | 'production'
- `status`: 'todo' | 'complete' | 'cancelled'  
- `priority`: 'high' | 'medium' | 'low'

Module-specific fields:
- `scriptPageId` - for Cue Notes
- `sceneSongId` - for Cue Notes  
- `lightwrightItemId` - for Work Notes

### Development Mode

The app uses a development mode system:
- Mock Supabase client in `lib/supabase/client.ts`
- No authentication required when `NEXT_PUBLIC_DEV_MODE=true`
- All data is mock data, not persisted
- Dark theme enabled by default in root layout

### Component Organization

- `app/` - Next.js App Router pages for each module
- `components/layout/` - Sidebar and dashboard layout components
- `components/providers.tsx` - React Query and other providers
- `lib/utils.ts` - Utility functions including `cn()` for conditional classes

### Styling System

- Dark theme optimized for theater environments
- Module-specific color coding (purple/blue/cyan)
- Status indicators (blue=todo, green=complete, gray=cancelled)
- Priority colors (red=high, orange=medium, green=low)
- Responsive sidebar that collapses

### Path Aliases

Uses `@/*` for absolute imports from project root via tsconfig paths.