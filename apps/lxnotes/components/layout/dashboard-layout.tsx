'use client'

import { useEffect } from 'react'
import { Sidebar } from './sidebar'
import { TabletLayout } from './tablet-layout'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useTabletModeStore } from '@/lib/stores/tablet-mode-store'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarStore()
  const { isTabletMode } = useTabletModeStore()
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')
  // Only demo mode has a banner now (production mode banner was removed)
  const hasBanner = isDemoMode

  // Scale the entire UI 2x in tablet mode for touch-friendly sizing
  useEffect(() => {
    if (isTabletMode) {
      document.documentElement.style.zoom = '2'
    } else {
      document.documentElement.style.zoom = ''
    }
    return () => {
      document.documentElement.style.zoom = ''
    }
  }, [isTabletMode])

  if (isTabletMode) {
    return <TabletLayout>{children}</TabletLayout>
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <main
        data-testid="main-content"
        className={cn(
          'transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64',
          hasBanner && 'pt-[36px]'
        )}
      >
        <div className="p-compact-4">
          {children}
        </div>
      </main>
    </div>
  )
}