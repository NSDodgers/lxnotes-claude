'use client'

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