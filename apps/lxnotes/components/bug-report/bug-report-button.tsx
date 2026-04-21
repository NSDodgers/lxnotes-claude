'use client'

import { useRef, useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Bug, Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuthContext } from '@/components/auth/auth-provider'
import { useIsMobile } from '@/lib/hooks/use-mobile-detect'
import { BugReportModal } from './bug-report-modal'
import { useBugReport } from './use-bug-report'

const EMPTY_SUBSCRIBE = () => () => {}
const getMountedClientSnapshot = () => true
const getMountedServerSnapshot = () => false

export function BugReportButton() {
  const { isAuthenticated, isLoading } = useAuthContext()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mounted = useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    getMountedClientSnapshot,
    getMountedServerSnapshot,
  )
  const [mobileBarPresent, setMobileBarPresent] = useState(false)
  const { openReport, isCapturing, modalProps } = useBugReport()

  // Track whether MobileActionBar is mounted. When it is, the in-bar icon
  // owns the mobile bug-report entry point and this floating button hides.
  // Re-check on route changes because MobileActionBar is rendered per-page.
  useEffect(() => {
    if (!mounted) return
    const check = () => {
      setMobileBarPresent(!!document.querySelector('[data-testid="mobile-action-bar"]'))
    }
    check()
    // Re-check after a tick to catch the bar mounting on the same navigation.
    const t = window.setTimeout(check, 50)
    return () => window.clearTimeout(t)
  }, [mounted, pathname])

  if (isLoading || !isAuthenticated || !mounted) return null

  // On mobile, hide if the action bar is present (its in-bar icon takes over).
  if (isMobile && mobileBarPresent) return null

  // Sizing: desktop FAB is 44px, mobile fallback FAB is 40px (smaller, no
  // content to clear since the bar is absent on these pages).
  const sizeClasses = isMobile ? 'h-10 w-10' : 'h-11 w-11'
  const iconSizeClasses = isMobile ? 'h-4 w-4' : 'h-5 w-5'

  return createPortal(
    <>
      <button
        ref={buttonRef}
        onClick={() => openReport(buttonRef.current)}
        disabled={isCapturing}
        data-testid="bug-report-button"
        aria-label="Report a bug"
        aria-busy={isCapturing}
        className={`fixed bottom-4 right-4 z-[2147483647] flex ${sizeClasses} pointer-events-auto items-center justify-center rounded-full bg-red-600 shadow-lg transition-colors hover:bg-red-500 disabled:opacity-70`}
        title="Report a bug"
      >
        {isCapturing ? (
          <Loader2 className={`${iconSizeClasses} text-white animate-spin`} />
        ) : (
          <Bug className={`${iconSizeClasses} text-white`} />
        )}
      </button>
      <BugReportModal {...modalProps} />
    </>,
    document.body
  )
}
