'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useEffect } from 'react'
import { useSidebarStore } from '@/lib/stores/sidebar-store'

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Rehydrate sidebar store on mount
  useEffect(() => {
    useSidebarStore.persist.rehydrate()
  }, [])

  return <DashboardLayout>{children}</DashboardLayout>
}
