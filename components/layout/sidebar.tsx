'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Lightbulb, 
  Wrench, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Cue Notes', href: '/cue-notes', icon: Lightbulb, color: 'text-modules-cue' },
  { name: 'Work Notes', href: '/work-notes', icon: Wrench, color: 'text-modules-work' },
  { name: 'Production Notes', href: '/production-notes', icon: FileText, color: 'text-modules-production' },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

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