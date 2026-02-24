'use client'

import { usePathname } from 'next/navigation'
import { TabletTopBar } from './tablet-top-bar'
import { TabletOverlaySidebar } from './tablet-overlay-sidebar'
import { TabletFilterChips } from './tablet-filter-chips'
import type { ModuleType } from '@/types'

function getModuleType(pathname: string): ModuleType | null {
  if (pathname.includes('/cue-notes')) return 'cue'
  if (pathname.includes('/work-notes')) return 'work'
  if (pathname.includes('/production-notes')) return 'production'
  return null
}

export function TabletLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const moduleType = getModuleType(pathname)

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-bg-primary" data-testid="tablet-mode-indicator">
      <TabletTopBar />
      {moduleType && <TabletFilterChips moduleType={moduleType} />}
      <TabletOverlaySidebar />
      <main className="flex-1 overflow-auto p-3">
        {children}
      </main>
    </div>
  )
}
