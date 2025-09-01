'use client'

import { useIsDemo, useDemoStore } from '@/lib/stores/demo-store'
import { Button } from '@/components/ui/button'
import { X, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DemoBannerProps {
  isDemo?: boolean
}

export function DemoBanner({ isDemo: isDemoProp }: DemoBannerProps) {
  const isDemoFromStore = useIsDemo()
  const isDemo = isDemoProp ?? isDemoFromStore
  const exitDemo = useDemoStore(state => state.exitDemo)
  const initializeDemo = useDemoStore(state => state.initializeDemo)
  const router = useRouter()

  if (!isDemo) return null

  const handleExitDemo = () => {
    exitDemo()
    router.push('/')
  }

  const handleResetDemo = () => {
    initializeDemo()
    window.location.reload()
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="text-lg">🎭</div>
        <div>
          <div className="font-semibold">Romeo & Juliet Demo</div>
          <div className="text-sm text-purple-100">
            You're exploring sample data from a theatrical production
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handleResetDemo}
          size="sm"
          variant="secondary"
          className="text-purple-700 hover:text-purple-800"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Reset Demo
        </Button>
        <Button
          onClick={handleExitDemo}
          size="sm"
          variant="secondary" 
          className="text-purple-700 hover:text-purple-800"
        >
          <Home className="w-4 h-4 mr-1" />
          Back to Homepage
        </Button>
        <Button
          onClick={handleExitDemo}
          size="sm"
          variant="ghost"
          className="text-purple-100 hover:text-white hover:bg-purple-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}