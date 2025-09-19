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

## Puppeteer MCP Visual Integration

You have access to Puppeteer MCP (Model Context Protocol) for browser automation and visual feedback. This enables you to see and interact with web pages during development, creating a powerful visual feedback loop for UI work.

### Core Capabilities

You can use Puppeteer to:
- Launch browsers and navigate to URLs
- Take screenshots for visual analysis
- Interact with page elements (click, type, scroll)
- Extract text and data from pages
- Compare visual output against designs
- Iterate autonomously on UI development

### Visual Feedback Loop Pattern

When working on UI/frontend tasks, follow this proven pattern:
1. **Implement** - Write the initial code
2. **Navigate** - Open the page in browser
3. **Screenshot** - Capture the current visual state
4. **Compare** - Analyze against requirements/mockups
5. **Iterate** - Make improvements based on visual differences
6. **Repeat** - Continue until the visual output matches expectations

Example workflow: "I'll implement the design, navigate to see it, take a screenshot to analyze, compare with your requirements, and iterate until it matches perfectly."

### Optimal Technical Configuration

#### Viewport Settings
- Use 1280×800 pixels for optimal visual analysis
- This resolution balances content visibility with processing efficiency

#### Screenshot Best Practices
- Use PNG format for UI elements and text (preserves sharp edges)
- Capture full-page screenshots for comprehensive analysis
- Take element-specific screenshots for focused validation
- Always screenshot before and after changes for comparison

#### Element Selection Hierarchy
When interacting with page elements, prioritize selectors in this order:
1. ID selectors (`#element-id`)
2. Data attributes (`[data-testid="component"]`)
3. Semantic HTML5 elements (`<main>`, `<nav>`, `<article>`)
4. Class selectors (`.class-name`)
5. CSS combinators as last resort

### Effective Automation Patterns

#### For UI Development Tasks
```
"Navigate to [route], take a screenshot, compare to the design mockup, note differences, fix the top issues, and repeat until the visual output matches the design."
```

#### For Data Extraction
```
"Go to [URL], take an initial screenshot, locate [specific data], capture focused screenshots of relevant sections, extract the information, and present it in [format]."
```

#### For Form Testing
```
"Navigate to the form, screenshot the empty state, fill all fields, screenshot to verify, check for validation errors, and submit only after visual confirmation."
```

#### For Visual Regression Testing
```
"Capture baseline screenshot, make code changes, capture new screenshot, compare for unintended changes, and flag any visual regressions."
```

### Error Handling Strategies

When elements aren't immediately available:
1. Wait for element visibility first
2. If standard interaction fails, try JavaScript evaluation
3. As last resort, use coordinate-based clicking
4. Always take a screenshot when encountering issues for debugging

For navigation:
- Implement retry logic with exponential backoff
- Wait for network idle after navigation
- Capture screenshots at each major step

### Prompt Patterns for Best Results

#### Direct Task Prompts
- "Navigate to [URL] and extract [specific information]"
- "Take a screenshot and tell me what you see"
- "Compare the current page to [design/requirement] and identify differences"

#### Iterative Improvement Prompts
- "Keep iterating on the styling until the screenshot matches the mockup"
- "Make adjustments based on the visual feedback and try again"
- "Use the screenshot to validate your changes, then continue improving"

#### Adaptive Problem-Solving
- "If the expected element isn't found, take a screenshot and find an alternative approach"
- "Handle any dynamic content or popups that appear"
- "Adapt to the actual page structure you encounter"

### Working with Dynamic Content

When pages have dynamic elements:
- Wait for content to load before screenshotting
- Use `waitForSelector` for specific elements
- Implement smart waiting strategies (network idle, specific elements)
- Take multiple screenshots if content changes over time

### Memory and Performance

- Close pages after use to free resources
- Reuse browser instances when possible
- Block unnecessary resources (fonts, ads) when they don't affect the task
- Set appropriate timeouts (30s for production, 60s for complex operations)

### Visual Analysis Guidelines

When analyzing screenshots:
- Describe positions ("button in top-right corner")
- Note relationships ("form below the header")
- Identify visual characteristics ("blue submit button")
- Recognize states ("disabled", "loading", "error")
- Compare layouts systematically (top to bottom, left to right)

### Common Workflows

#### UI Development Workflow
1. Receive design requirements
2. Implement initial version
3. Navigate and screenshot
4. Compare with design
5. List all differences
6. Fix most important issues
7. Screenshot and verify
8. Repeat until satisfied

#### Testing Workflow
1. Navigate to application
2. Screenshot initial state
3. Perform user actions
4. Screenshot after each action
5. Verify expected changes
6. Document any issues found

#### Data Extraction Workflow
1. Navigate to target page
2. Screenshot for context
3. Locate data elements
4. Extract information
5. Handle pagination if needed
6. Format and present results

### Key Success Factors

1. **Always use visual verification** - Don't assume success without seeing it
2. **Iterate based on screenshots** - Let visual feedback guide improvements
3. **Be specific about visual requirements** - Clear descriptions lead to better results
4. **Handle failures gracefully** - Use screenshots to debug issues
5. **Maintain context between iterations** - Remember what you've tried and learned

### Example Integration

When asked to "make the header match the design":
```
I'll use Puppeteer to:
1. Navigate to your page and take a screenshot
2. Compare the current header with your design requirements
3. Identify specific differences (colors, spacing, alignment)
4. Update the CSS/HTML to address these differences
5. Take another screenshot to verify improvements
6. Continue iterating until the header matches perfectly
```

Remember: The power of Puppeteer MCP lies in eliminating manual feedback loops. You can see what you're building, validate it visually, and iterate autonomously until it's perfect.

## Sessions System Behaviors

@CLAUDE.sessions.md
