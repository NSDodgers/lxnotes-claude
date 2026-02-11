'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PolicyFooterProps {
  /** Layout orientation */
  layout?: 'horizontal' | 'vertical'
  /** Additional CSS classes */
  className?: string
}

/**
 * PolicyFooter Component
 *
 * Displays links to policy documents (Acceptable Use, Privacy, Terms).
 * Automatically detects demo mode and adjusts URLs accordingly.
 */
export function PolicyFooter({ layout = 'horizontal', className }: PolicyFooterProps) {
  const pathname = usePathname()
  const isPublicContext = pathname === '/' || pathname.startsWith('/public')
  const isDemoMode = pathname.startsWith('/demo')
  const baseUrl = isPublicContext
    ? '/public/policies'
    : isDemoMode
      ? '/demo/policies'
      : '/policies'

  const policies = [
    { name: 'Acceptable Use', href: `${baseUrl}/acceptable-use` },
    { name: 'Privacy', href: `${baseUrl}/privacy` },
    { name: 'Terms of Service', href: `${baseUrl}/terms` },
    { name: 'App Policy', href: `${baseUrl}/app-policy` },
    { name: 'Cookie Policy', href: `${baseUrl}/cookie` },
    { name: 'Cookie Settings', type: 'cookie-trigger' as const },
  ]

  /**
   * Opens the GetTerms cookie preferences dialog
   * Uses the gtCookieWidgetPreview API to show the preferences modal
   */
  const handleCookieSettingsClick = () => {
    if (typeof window !== 'undefined' && typeof window.gtCookieWidgetPreview === 'function') {
      window.gtCookieWidgetPreview()
    }
  }

  if (layout === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {policies.map((policy) => (
          policy.type === 'cookie-trigger' ? (
            <button
              key={policy.name}
              onClick={handleCookieSettingsClick}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors text-left"
            >
              {policy.name}
            </button>
          ) : (
            <Link
              key={policy.name}
              href={policy.href!}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {policy.name}
            </Link>
          )
        ))}
      </div>
    )
  }

  // Horizontal layout
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-3 gap-y-1', className)}>
      {policies.map((policy, index) => (
        <span key={policy.name} className="flex items-center gap-3">
          {policy.type === 'cookie-trigger' ? (
            <button
              onClick={handleCookieSettingsClick}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {policy.name}
            </button>
          ) : (
            <Link
              href={policy.href!}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {policy.name}
            </Link>
          )}
          {index < policies.length - 1 && (
            <span className="text-text-muted">|</span>
          )}
        </span>
      ))}
    </div>
  )
}
