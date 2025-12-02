'use client'

import { Sidebar } from './sidebar'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/stores/sidebar-store'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarStore()
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')
  const isCollaborativeMode = pathname.startsWith('/romeo-juliet')

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <main
        data-testid="main-content"
        className={cn(
          'transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64',
          (isDemoMode || isCollaborativeMode) && 'pt-[36px]'
        )}
      >
        <div className="p-compact-4">
          {children}
        </div>
      </main>
    </div>
  )
}