'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface PolicyEmbedProps {
  /** GetTerms account ID */
  accountId: string
  /** Document type (e.g., 'acceptable-use', 'privacy', 'terms-of-service') */
  documentType: string
  /** Language code (default: 'en-us') */
  lang?: string
  /** Display mode (default: 'direct') */
  mode?: 'direct' | 'modal'
}

type LoadState = 'loading' | 'ready' | 'error'

interface GetTermsMessage {
  uuid?: string
  html?: string
  height?: number
  embed_styles?: string
}

/**
 * PolicyEmbed Component
 *
 * Client-side wrapper around the GetTerms embed iframe that manages its
 * lifecycle so the policy renders reliably across client navigations.
 */
export function PolicyEmbed({
  accountId,
  documentType,
  lang = 'en-us',
  mode = 'direct'
}: PolicyEmbedProps) {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleRetry = () => {
    setLoadState('loading')
    setRetryCount(prev => prev + 1)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const normalizedLang = lang.replace(/_/g, '-').toLowerCase()
    const embedOrigin = 'https://gettermscdn.com'
    const trimmedOrigin = embedOrigin.replace(/\/+$/, '')
    const embedUuid = `${accountId}/${documentType}/${normalizedLang}/0`
    const embedUrl = `${trimmedOrigin}/embed/${accountId}/${documentType}/${normalizedLang}?i=0&mode=${mode}`

    container.innerHTML = ''
    container.removeAttribute('data-getterms-styles')
    setLoadState('loading')

    let isActive = true
    let isResolved = false

    const iframe = document.createElement('iframe')
    iframe.className = 'getterms-iframe'
    iframe.dataset.uuid = embedUuid
    iframe.dataset.mode = mode
    iframe.scrolling = 'no'
    iframe.src = embedUrl
    iframe.style.border = '0'
    iframe.style.padding = '0'
    iframe.style.margin = '0'
    iframe.style.height = '0px'
    if (mode === 'direct') {
      iframe.style.width = '0px'
      iframe.style.display = 'none'
    } else {
      iframe.style.width = '100%'
    }

    const timeoutId = window.setTimeout(() => {
      if (!isResolved && isActive) {
        console.error('GetTerms content load timed out')
        setLoadState('error')
      }
    }, 10000)

    const handleMessage = (event: MessageEvent<GetTermsMessage>) => {
      if (event.origin !== trimmedOrigin) {
        return
      }

      const payload = event.data
      if (!payload || payload.uuid !== embedUuid) {
        return
      }

      if (isResolved) {
        return
      }

      if (mode === 'direct') {
        if (payload.embed_styles === 'true') {
          container.dataset.gettermsStyles = 'true'
        }
        container.innerHTML = payload.html ?? ''
      } else if (typeof payload.height === 'number') {
        iframe.style.height = `${payload.height}px`
        iframe.style.width = '100%'
      }

      isResolved = true
      window.clearTimeout(timeoutId)
      if (isActive) {
        setLoadState('ready')
      }
    }

    window.addEventListener('message', handleMessage)
    container.appendChild(iframe)

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
      window.removeEventListener('message', handleMessage)
      if (container.contains(iframe)) {
        container.removeChild(iframe)
      }
    }
  }, [accountId, documentType, lang, mode, retryCount])

  return (
    <div className="policy-embed-container relative min-h-[400px]">
      {/* Loading State */}
      {loadState === 'loading' && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm">Loading policy content...</p>
        </div>
      )}

      {/* Error State */}
      {loadState === 'error' && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
          <p className="mb-2 font-medium">Failed to load policy content</p>
          <p className="mb-4 text-sm text-gray-500">
            Unable to connect to GetTerms CDN. Please check your internet connection.
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Policy Embed Container - hidden until ready */}
      <div
        className="transition-opacity duration-300 ease-in-out"
        style={{
          opacity: loadState === 'ready' ? 1 : 0,
          pointerEvents: loadState === 'ready' ? 'auto' : 'none'
        }}
      >
        <div
          className="getterms-document-embed"
          ref={containerRef}
          data-getterms={accountId}
          data-getterms-document={documentType}
          data-getterms-lang={lang}
          data-getterms-mode={mode}
          data-getterms-env="https://gettermscdn.com"
        />
      </div>

      {/* CSS Override Styles for Dark Mode Compatibility */}
      <style jsx global>{`
        .getterms-document-embed {
          color: #1f2937 !important;
        }
        .getterms-document-embed * {
          color: inherit !important;
        }
        .getterms-document-embed h1,
        .getterms-document-embed h2,
        .getterms-document-embed h3,
        .getterms-document-embed h4,
        .getterms-document-embed h5,
        .getterms-document-embed h6 {
          color: #111827 !important;
          font-weight: 600 !important;
        }
        .getterms-document-embed a {
          color: #2563eb !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  )
}
