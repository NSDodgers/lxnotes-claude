'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { LogOut, Shield, Database } from 'lucide-react'
import Link from 'next/link'
import { useAuthContext } from './auth-provider'
import { SUPER_ADMIN_EMAIL } from '@/lib/auth/constants'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  collapsed?: boolean
  dropdownDirection?: 'up' | 'down'
}

export function UserMenu({ collapsed = false, dropdownDirection = 'up' }: UserMenuProps) {
  const { user, isLoading, signOut } = useAuthContext()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-compact-3">
        <div className="h-8 w-8 rounded-full bg-bg-tertiary animate-pulse" />
        {!collapsed && (
          <div className="space-y-1">
            <div className="h-4 w-24 bg-bg-tertiary rounded animate-pulse" />
            <div className="h-3 w-32 bg-bg-tertiary rounded animate-pulse" />
          </div>
        )}
      </div>
    )
  }

  if (!user) {
    return (
      <div className={cn('flex items-center gap-compact-3', collapsed && 'justify-center')}>
        <div className="h-8 w-8 rounded-full bg-bg-tertiary" />
        {!collapsed && (
          <div className="text-sm">
            <p className="text-text-muted">Not signed in</p>
          </div>
        )}
      </div>
    )
  }

  const displayName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const avatarUrl = user.user_metadata?.avatar_url

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-compact-3 w-full hover:bg-bg-tertiary rounded-lg p-1 transition-colors',
          collapsed && 'justify-center'
        )}
      >
        <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground text-sm font-medium overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        {!collapsed && (
          <div className="text-sm text-left flex-1 min-w-0 overflow-hidden">
            <p className="text-text-primary flex items-center gap-1">
              <span className="truncate">{displayName}</span>
              {isSuperAdmin && (
                <span title="Super Admin" className="flex-shrink-0">
                  <Shield className="h-3 w-3 text-yellow-500" />
                </span>
              )}
            </p>
            <p className="text-text-muted truncate">{user.email}</p>
          </div>
        )}
      </button>

      {isOpen && (
        <div className={cn(
          "absolute w-48 bg-bg-secondary border border-border rounded-lg shadow-lg py-1 z-50",
          dropdownDirection === 'up' ? "bottom-full left-0 mb-2" : "top-full right-0 mt-2"
        )}>
          {isSuperAdmin && (
            <Link
              href="/settings/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <Database className="h-4 w-4 text-yellow-500" />
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-bg-tertiary transition-colors w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
