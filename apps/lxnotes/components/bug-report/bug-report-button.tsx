'use client'

import { useState, useCallback, useRef } from 'react'
import { Bug } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuthContext } from '@/components/auth/auth-provider'
import { BugReportModal } from './bug-report-modal'

function inferModule(pathname: string): string {
  if (pathname.includes('/cue')) return 'Cue Notes'
  if (pathname.includes('/work')) return 'Work Notes'
  if (pathname.includes('/production')) return 'Production Notes'
  if (pathname.includes('/actor')) return 'Actor Tracking'
  if (pathname.includes('/settings')) return 'Settings'
  return 'General'
}

function getBrowserInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Firefox/')) return `Firefox ${ua.split('Firefox/')[1]?.split(' ')[0]}`
  if (ua.includes('Edg/')) return `Edge ${ua.split('Edg/')[1]?.split(' ')[0]}`
  if (ua.includes('Chrome/')) return `Chrome ${ua.split('Chrome/')[1]?.split(' ')[0]}`
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return `Safari ${ua.split('Version/')[1]?.split(' ')[0] || ''}`
  return 'Unknown'
}

function getOSInfo(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Mac OS X')) return `macOS ${ua.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || ''}`
  if (ua.includes('Windows NT')) return `Windows ${ua.match(/Windows NT ([0-9.]+)/)?.[1] || ''}`
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS'
  return 'Unknown'
}

export function BugReportButton() {
  const { isAuthenticated, isLoading } = useAuthContext()
  const pathname = usePathname()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(async () => {
    setIsCapturing(true)
    let capturedScreenshot: string | null = null

    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const canvas = await html2canvas(document.documentElement, {
        scale: window.devicePixelRatio > 1 ? 1 : undefined,
        logging: false,
        useCORS: true,
        foreignObjectRendering: false,
        ignoreElements: (el) => {
          if (el === buttonRef.current) return true
          // Skip cross-origin images that would taint the canvas
          if (el instanceof HTMLImageElement && el.crossOrigin === null && el.src.startsWith('http') && !el.src.startsWith(window.location.origin)) return true
          return false
        },
      })
      const dataUrl = canvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      if (base64 && base64.length > 100) {
        capturedScreenshot = base64
      } else {
        console.warn('Screenshot capture produced empty result')
      }
    } catch (err) {
      console.error('Screenshot capture failed:', err)
    }

    setScreenshot(capturedScreenshot)
    setIsCapturing(false)
    setIsModalOpen(true)
  }, [])

  if (isLoading || !isAuthenticated) return null

  const context = {
    route: pathname,
    module: inferModule(pathname),
    browser: getBrowserInfo(),
    os: getOSInfo(),
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={isCapturing}
        data-testid="bug-report-button"
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-red-600 shadow-lg transition-colors hover:bg-red-500 disabled:opacity-50"
        title="Report a bug"
      >
        <Bug className="h-5 w-5 text-white" />
      </button>
      <BugReportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        screenshot={screenshot}
        onRemoveScreenshot={() => setScreenshot(null)}
        context={context}
      />
    </>
  )
}
