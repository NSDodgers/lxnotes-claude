'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { TabletTopBar } from './tablet-top-bar'
import { TabletOverlaySidebar } from './tablet-overlay-sidebar'
import { TabletFilterChips } from './tablet-filter-chips'
import type { ModuleType } from '@/types'

function getModuleType(pathname: string): ModuleType | null {
  if (pathname.includes('/cue-notes')) return 'cue'
  if (pathname.includes('/work-notes')) return 'work'
  if (pathname.includes('/electrician-notes')) return 'electrician'
  if (pathname.includes('/production-notes')) return 'production'
  return null
}

export function TabletLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const moduleType = getModuleType(pathname)
  const isDemoMode = pathname.startsWith('/demo')

  return (
    <div
      className={cn("flex flex-col bg-bg-primary overflow-hidden", isDemoMode && "pt-[18px]")}
      style={{
        width: '50vw',
        height: '50vh',
        transform: 'scale(2)',
        transformOrigin: 'top left',
      }}
      data-testid="tablet-mode-indicator"
    >
      <TabletTopBar />
      {moduleType && <TabletFilterChips moduleType={moduleType} />}
      <TabletOverlaySidebar />
      <main className="flex-1 overflow-auto p-3">
        {children}
      </main>
    </div>
  )
}
