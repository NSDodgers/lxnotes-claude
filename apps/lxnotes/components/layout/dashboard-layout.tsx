'use client'

import { Sidebar } from './sidebar'
import { DesignerLayout } from './designer-layout'
import { MobileLayout } from './mobile-layout'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useDesignerModeStore } from '@/lib/stores/designer-mode-store'
import { useIsMobile } from '@/lib/hooks/use-mobile-detect'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarStore()
  const { isDesignerMode } = useDesignerModeStore()
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')
  // Only demo mode has a banner now (production mode banner was removed)
  const hasBanner = isDemoMode

  // Note: Designer mode scaling is handled via CSS transform in designer-layout.tsx
  // CSS zoom breaks touch event coordinates on iOS Safari

  // Designer mode takes priority — it's an explicit user choice to preview tablet layout,
  // even on narrow viewports like iPad Mini (744px)
  if (isDesignerMode) {
    return <DesignerLayout>{children}</DesignerLayout>
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>
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