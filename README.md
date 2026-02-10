# LX Notes - Production Notes Manager

A collaborative lighting and production notes management system for theatrical teams. Built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Getting Started

The application is currently running in development mode with relaxed security for easy testing.

### Access the Application

Open your browser and navigate to:
```
http://localhost:3001
```

## 🎭 Features

### Three Core Modules

1. **Cue Notes** (Purple)
   - Manage lighting cues and effects
   - Link notes to script pages
   - Track lighting design moments and states

2. **Work Notes** (Blue)
   - Track equipment and technical tasks
   - Import Lightwright CSV data
   - Reference equipment by LWID

3. **Production Notes** (Cyan)
   - Cross-department communication
   - Coordinate between teams
   - No external lookups required

### Key Functionality

- ✅ **Quick Add** - Fast note creation for each module
- ✅ **Status Tracking** - Todo, Complete, Cancelled states
- ✅ **Priority Levels** - High, Medium, Low priorities with visual indicators
- ✅ **Search & Filter** - Find notes quickly across modules
- ✅ **Dark Mode** - Optimized for theater environments
- ✅ **Responsive Design** - Works on desktop and tablets

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS (dark mode optimized)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Database**: Supabase (configured for future integration)

## 📁 Project Structure

```
lxnotesapparch/
├── app/                    # Next.js App Router pages
│   ├── cue-notes/         # Cue notes module
│   ├── work-notes/        # Work notes module
│   ├── production-notes/  # Production notes module
│   ├── settings/          # Settings page
│   └── page.tsx           # Dashboard home
├── components/            # React components
│   └── layout/           # Layout components (Sidebar, Dashboard)
├── lib/                  # Utilities and services
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🎨 Design System

### Color Palette (Dark Theme)
- **Background**: Shades from `#0a0a0a` to `#2a2a2a`
- **Text**: High contrast whites and grays
- **Module Colors**:
  - Cue Notes: Purple (`#8b5cf6`)
  - Work Notes: Blue (`#3b82f6`)
  - Production Notes: Cyan (`#06b6d4`)
- **Status Colors**:
  - Todo: Blue
  - Complete: Green
  - Cancelled: Gray
- **Priority Indicators**:
  - High: Red
  - Medium: Orange
  - Low: Green

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Currently using development mode with mock data. To connect to real services, update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_DEV_MODE=false
```

## 🚦 Current Status

The application is running with:
- ✅ All three note modules functional
- ✅ Basic CRUD operations working
- ✅ Mock data for development
- ✅ No authentication required (for development)
- ✅ Responsive dark theme applied

## 🔜 Next Steps

1. **Database Integration** - Connect Supabase for persistent storage
2. **Authentication** - Add user login (currently bypassed)
3. **Real-time Updates** - Enable collaborative features
4. **PDF Export** - Implement with React PDF
5. **Email Integration** - Connect Resend
6. **Stripe Payments** - Add production billing
7. **Preset System** - Build template management
8. **Mobile Optimization** - Enhance tablet/phone experience

## 📝 Notes

- The app starts in dark mode by default (optimized for theaters)
- All data is currently mock data and not persisted
- Authentication is disabled for easy development access
- The sidebar is collapsible for more screen space

## 🎯 Quick Test Guide

1. **Dashboard** - View overview and quick stats
2. **Cue Notes** - Click "Add Cue Note" to create lighting notes
3. **Work Notes** - Track equipment tasks, preview Lightwright import
4. **Production Notes** - Add cross-department communication
5. **Settings** - Configure production and module preferences

Each note can be:
- Marked as complete ✓
- Cancelled ✗
- Reopened ↻
- Filtered by status
- Searched by title/description

Enjoy using LX Notes! 🎭✨