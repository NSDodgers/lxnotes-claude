'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut
} from 'lucide-react'
import { useDesignerModeStore } from '@/lib/stores/designer-mode-store'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useSidebarConfigStore } from '@/lib/stores/sidebar-config-store'
import { MODULE_REGISTRY, COMBINED_VIEW_REGISTRY, getModuleConfig, getCombinedViewConfig } from '@/lib/config/modules'
import { PolicyFooter } from './policy-footer'
import { UserMenu } from '@/components/auth/user-menu'
import { useNotes } from '@/lib/contexts/notes-context'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebarStore()
  const { config, isLoaded, fetchFromSupabase, getVisibleModules, getVisibleCombinedViews } = useSidebarConfigStore()
  const pathname = usePathname()
  const { connectionStatus } = useNotes()

  // Detect mode: demo, production, or default (must be before effects that use isDemoMode)
  const isDemoMode = pathname.startsWith('/demo')
  const isProductionMode = pathname.startsWith('/production/')

  // Hydrate sidebar config store from localStorage on mount
  useEffect(() => {
    useSidebarConfigStore.persist.rehydrate()
  }, [])

  // Fetch config from Supabase when authenticated (not in demo mode)
  useEffect(() => {
    if (isDemoMode) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) {
        fetchFromSupabase(data.user.id)
      }
    })
  }, [isDemoMode, fetchFromSupabase])
  // Only demo mode has a banner now (production mode banner was removed)
  const hasBanner = isDemoMode

  // Extract production ID if in production mode
  const productionId = isProductionMode
    ? pathname.split('/')[2] // /production/[id]/...
    : null

  // Build base URL for navigation
  const baseUrl = isDemoMode
    ? '/demo'
    : isProductionMode
      ? `/production/${productionId}`
      : ''

  // Build navigation from registry + user config
  const visibleModules = getVisibleModules()
  const visibleCombinedViews = getVisibleCombinedViews()

  const moduleNavItems = visibleModules.map((entry) => {
    const mod = getModuleConfig(entry.id)
    if (!mod) return null
    return { name: mod.label, href: `${baseUrl}${mod.route}`, icon: mod.icon, color: mod.colorClass }
  }).filter(Boolean) as { name: string; href: string; icon: React.ComponentType<{ className?: string }>; color: string }[]

  const combinedNavItems = visibleCombinedViews.map((entry) => {
    const view = getCombinedViewConfig(entry.id)
    if (!view) return null
    return { name: view.label, href: `${baseUrl}${view.route}`, icon: view.icon, color: view.colorClass }
  }).filter(Boolean) as { name: string; href: string; icon: React.ComponentType<{ className?: string }>; color: string }[]

  const navigation = [
    ...moduleNavItems,
    ...combinedNavItems,
    { name: 'Settings', href: `${baseUrl}/settings`, icon: Settings, color: '' },
  ]
  const { isDesignerMode, toggleDesignerMode } = useDesignerModeStore()

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'fixed left-0 z-40 bg-bg-secondary border-r border-bg-tertiary transition-all duration-300',
        hasBanner ? 'top-[36px] h-[calc(100vh-36px)]' : 'top-0 h-screen',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className={cn(
          "flex items-center px-compact-4 transition-all duration-300",
          collapsed
            ? "h-compact-18 flex-col justify-center gap-compact-2 pt-compact-4"
            : "h-compact-14 justify-between pt-compact-3"
        )}>
          {collapsed ? (
            <Image
              src="/images/lxnotes_logo_stacked.png"
              alt="LX Notes"
              width={28}
              height={28}
              style={{ height: 'auto' }}
              className="object-contain"
            />
          ) : (
            <Image
              src="/images/lxnotes_logo_horiz.png"
              alt="LX Notes"
              width={120}
              height={40}
              style={{ height: 'auto' }}
              className="object-contain"
            />
          )}
          <button
            onClick={toggleCollapsed}
            className={cn(
              "hover:bg-bg-tertiary rounded-lg transition-colors",
              collapsed
                ? "p-compact-1"
                : "p-compact-2"
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="sidebar-collapse"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-compact-2 py-compact-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-compact-3 rounded-lg px-compact-3 py-compact-2 text-sm font-medium transition-all duration-200',
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

          {/* Exit to Homepage - only in production mode */}
          {isProductionMode && (
            <Link
              href="/"
              className={cn(
                'flex items-center gap-compact-3 rounded-lg px-compact-3 py-compact-2 text-sm font-medium transition-colors mt-2 border-t border-bg-tertiary pt-3',
                'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                collapsed && 'justify-center'
              )}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Exit to Homepage</span>}
            </Link>
          )}
        </nav>

        {/* Designer Mode Toggle */}
        <div className="border-t border-bg-tertiary p-compact-4">
          <div className={cn(
            'flex items-center gap-compact-3 mb-compact-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            {!collapsed && (
              <div className="flex items-center gap-compact-2">
                <LayoutDashboard className="h-4 w-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">Designer Mode</span>
              </div>
            )}
            <button
              onClick={toggleDesignerMode}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isDesignerMode ? 'bg-modules-production' : 'bg-bg-tertiary',
                collapsed && 'mx-auto'
              )}
              title={collapsed ? 'Toggle Designer Mode' : undefined}
              data-testid="designer-mode-toggle"
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform',
                  isDesignerMode ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>

        {/* Policy Links & Build Info */}
        {!collapsed && (
          <div className="border-t border-bg-tertiary px-compact-4 py-compact-3">
            <PolicyFooter layout="vertical" />
            <p className="mt-compact-2 text-xs text-text-tertiary flex items-center gap-1">
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full',
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  connectionStatus === 'error' ? 'bg-red-500' :
                  'bg-gray-500'
                )}
                title={`Realtime: ${connectionStatus}`}
              />
              Build: {process.env.NEXT_PUBLIC_BUILD_SHA}
            </p>
          </div>
        )}

        {/* Footer - User Menu */}
        <div className="border-t border-bg-tertiary p-compact-4">
          <UserMenu collapsed={collapsed} />
        </div>
      </div>
    </aside>
  )
}