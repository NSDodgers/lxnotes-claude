'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Lightbulb, Wrench, Zap, FileText, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { useDesignerModeStore } from '@/lib/stores/designer-mode-store'
import { UserMenu } from '@/components/auth/user-menu'

export function DesignerOverlaySidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { designerSidebarOpen, setDesignerSidebarOpen, toggleDesignerMode } = useDesignerModeStore()

  const isDemoMode = pathname.startsWith('/demo')
  const isProductionMode = pathname.startsWith('/production/')
  const productionId = isProductionMode ? pathname.split('/')[2] : null

  const baseUrl = isDemoMode
    ? '/demo'
    : isProductionMode
      ? `/production/${productionId}`
      : ''

  const navigation = [
    { name: 'Cue Notes', href: `${baseUrl}/cue-notes`, icon: Lightbulb, color: 'text-modules-cue' },
    { name: 'Work Notes', href: `${baseUrl}/work-notes`, icon: Wrench, color: 'text-modules-work' },
    { name: 'Electrician Notes', href: `${baseUrl}/electrician-notes`, icon: Zap, color: 'text-modules-electrician' },
    { name: 'Production Notes', href: `${baseUrl}/production-notes`, icon: FileText, color: 'text-modules-production' },
    { name: 'Settings', href: `${baseUrl}/settings`, icon: Settings },
  ]

  if (!designerSidebarOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setDesignerSidebarOpen(false)}
        data-testid="designer-sidebar-backdrop"
      />

      {/* Slide-in panel */}
      <aside
        className="fixed left-0 top-0 z-50 h-screen w-[280px] bg-bg-secondary border-r border-bg-tertiary flex flex-col animate-fade-cue"
        data-testid="designer-overlay-sidebar"
      >
        {/* Logo */}
        <div className="flex items-center px-4 h-14 border-b border-bg-tertiary">
          <Image
            src="/images/lxnotes_logo_horiz.png"
            alt="LX Notes"
            width={120}
            height={40}
            style={{ height: 'auto' }}
            className="object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  setDesignerSidebarOpen(false)
                  router.push(item.href)
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-target',
                  isActive
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                )}
              >
                <item.icon className={cn('h-5 w-5', item.color)} />
                <span>{item.name}</span>
              </Link>
            )
          })}

          {/* Exit to Homepage - only in production mode */}
          {isProductionMode && (
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault()
                setDesignerSidebarOpen(false)
                router.push('/')
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-target text-text-secondary hover:bg-bg-tertiary hover:text-text-primary mt-2 border-t border-bg-tertiary pt-4"
            >
              <LogOut className="h-5 w-5" />
              <span>Exit to Homepage</span>
            </Link>
          )}
        </nav>

        {/* Designer mode toggle (to exit) */}
        <div className="border-t border-bg-tertiary p-4">
          <button
            onClick={() => {
              setDesignerSidebarOpen(false)
              toggleDesignerMode()
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors w-full touch-target"
            data-testid="designer-mode-exit"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Exit Designer Mode</span>
          </button>
        </div>

        {/* User menu */}
        <div className="border-t border-bg-tertiary p-4">
          <UserMenu dropdownDirection="up" />
        </div>
      </aside>
    </>
  )
}
