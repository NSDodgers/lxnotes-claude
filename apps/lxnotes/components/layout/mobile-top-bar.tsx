'use client'

import { usePathname } from 'next/navigation'
import { Menu, Lightbulb, Wrench, Zap, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobileDrawerStore } from '@/lib/stores/mobile-drawer-store'
import type { ModuleType } from '@/types'

function getModuleInfo(pathname: string) {
  if (pathname.includes('/cue-notes')) {
    return { name: 'Cue Notes', icon: Lightbulb, color: 'text-modules-cue', moduleType: 'cue' as ModuleType }
  }
  if (pathname.includes('/work-notes')) {
    return { name: 'Work Notes', icon: Wrench, color: 'text-modules-work', moduleType: 'work' as ModuleType }
  }
  if (pathname.includes('/electrician-notes')) {
    return { name: 'Electrician Notes', icon: Zap, color: 'text-modules-electrician', moduleType: 'electrician' as ModuleType }
  }
  if (pathname.includes('/production-notes')) {
    return { name: 'Prod. Notes', icon: FileText, color: 'text-modules-production', moduleType: 'production' as ModuleType }
  }
  if (pathname.includes('/settings')) {
    return { name: 'Settings', icon: Settings, color: 'text-text-secondary', moduleType: null }
  }
  return null
}

export { getModuleInfo }

export function MobileTopBar() {
  const pathname = usePathname()
  const moduleInfo = getModuleInfo(pathname)
  const { toggle } = useMobileDrawerStore()

  const ModuleIcon = moduleInfo?.icon

  return (
    <div
      data-testid="mobile-top-bar"
      className="h-11 flex-none flex items-center gap-2 px-3 bg-bg-secondary border-b border-bg-tertiary"
    >
      <button
        onClick={toggle}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
        aria-label="Open menu"
        data-testid="mobile-menu-button"
      >
        <Menu className="h-5 w-5" />
      </button>

      {moduleInfo && ModuleIcon && (
        <div className="flex items-center gap-1.5 min-w-0">
          <ModuleIcon className={cn('h-4 w-4 shrink-0', moduleInfo.color)} />
          <span className="font-semibold text-sm truncate">{moduleInfo.name}</span>
        </div>
      )}
    </div>
  )
}
