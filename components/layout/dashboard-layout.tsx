'use client'

import { Sidebar } from './sidebar'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <main 
        data-testid="main-content"
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}