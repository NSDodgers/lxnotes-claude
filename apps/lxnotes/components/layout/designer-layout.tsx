'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DesignerTopBar } from './designer-top-bar'
import { DesignerOverlaySidebar } from './designer-overlay-sidebar'
import { DesignerFilterChips } from './designer-filter-chips'
import type { ModuleType } from '@/types'

function getModuleType(pathname: string): ModuleType | null {
  if (pathname.includes('/cue-notes')) return 'cue'
  if (pathname.includes('/work-notes')) return 'work'
  if (pathname.includes('/electrician-notes')) return 'electrician'
  if (pathname.includes('/production-notes')) return 'production'
  return null
}

export function DesignerLayout({ children }: { children: React.ReactNode }) {
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
      data-testid="designer-mode-indicator"
    >
      <DesignerTopBar />
      {moduleType && <DesignerFilterChips moduleType={moduleType} />}
      <DesignerOverlaySidebar />
      <main className="flex-1 overflow-auto p-3">
        {children}
      </main>
    </div>
  )
}
