'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Lightbulb, 
  Wrench, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Tablet
} from 'lucide-react'
import { useState } from 'react'
import { useTabletModeStore } from '@/lib/stores/tablet-mode-store'

const navigation = [
  { name: 'Cue Notes', href: '/cue-notes', icon: Lightbulb, color: 'text-modules-cue' },
  { name: 'Work Notes', href: '/work-notes', icon: Wrench, color: 'text-modules-work' },
  { name: 'Production Notes', href: '/production-notes', icon: FileText, color: 'text-modules-production' },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { isTabletMode, toggleTabletMode } = useTabletModeStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-bg-secondary border-r border-bg-tertiary transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className={cn(
          "flex items-center px-4 transition-all duration-300",
          collapsed 
            ? "h-20 flex-col justify-center gap-2" 
            : "h-16 justify-between"
        )}>
          {collapsed ? (
            <Image
              src="/images/lxnotes_logo_stacked.png"
              alt="LX Notes"
              width={28}
              height={28}
              className="object-contain"
            />
          ) : (
            <Image
              src="/images/lxnotes_logo_horiz.png"
              alt="LX Notes"
              width={120}
              height={40}
              className="object-contain"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hover:bg-bg-tertiary rounded-lg transition-colors",
              collapsed 
                ? "p-1.5" 
                : "p-2"
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                  collapsed && 'justify-center'
                )}
              >
                <item.icon className={cn('h-5 w-5', item.color)} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Tablet Mode Toggle */}
        <div className="border-t border-bg-tertiary p-4">
          <div className={cn(
            'flex items-center gap-3 mb-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Tablet className="h-4 w-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">Tablet Mode</span>
              </div>
            )}
            <button
              onClick={toggleTabletMode}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isTabletMode ? 'bg-modules-production' : 'bg-bg-tertiary',
                collapsed && 'mx-auto'
              )}
              title={collapsed ? 'Toggle Tablet Mode' : undefined}
            >
              <span 
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isTabletMode ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-bg-tertiary p-4">
          <div className={cn(
            'flex items-center gap-3',
            collapsed && 'justify-center'
          )}>
            <div className="h-8 w-8 rounded-full bg-bg-tertiary" />
            {!collapsed && (
              <div className="text-sm">
                <p className="text-text-primary">Dev User</p>
                <p className="text-text-muted">dev@lxnotes.app</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}