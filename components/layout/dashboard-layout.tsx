'use client'

import { Sidebar } from './sidebar'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main
        data-testid="main-content"
        className={cn(
          'transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64',
          isDemoMode && 'pt-[36px]'
        )}
      >
        <div className="p-compact-4">
          {children}
        </div>
      </main>
    </div>
  )
}