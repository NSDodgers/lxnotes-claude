'use client'

import { usePathname } from 'next/navigation'
import { DemoBanner } from '@/components/demo/demo-banner'
import { MobileTopBar } from './mobile-top-bar'
import { MobileDrawer } from './mobile-drawer'

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')

  return (
    <div className={`flex flex-col h-dvh bg-bg-primary ${isDemoMode ? 'pt-[36px]' : ''}`}>
      {isDemoMode && <DemoBanner />}
      <MobileTopBar />
      <MobileDrawer />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
