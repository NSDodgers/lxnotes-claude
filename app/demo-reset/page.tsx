'use client'

import { useEffect, useState } from 'react'
import { DemoDataService } from '@/lib/services/demo-data-service'
import { useDemoStore } from '@/lib/stores/demo-store'
import { useRouter } from 'next/navigation'

export default function DemoResetPage() {
  const [isResetting, setIsResetting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const router = useRouter()
  const { initializeDemo, exitDemo } = useDemoStore()

  useEffect(() => {
    const resetDemo = async () => {
      setIsResetting(true)
      
      try {
        // Clear ALL localStorage in development to ensure fresh start
        localStorage.clear()
        
        // Clear all demo data
        DemoDataService.clearDemoData()
        exitDemo()
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Initialize fresh demo data
        initializeDemo()
        
        setIsComplete(true)
        
        // Force a hard refresh to ensure all stores are re-initialized
        setTimeout(() => {
          window.location.href = '/manage-script?demo=true'
        }, 1500)
        
      } catch (error) {
        console.error('Error resetting demo:', error)
      } finally {
        setIsResetting(false)
      }
    }
    
    resetDemo()
  }, [exitDemo, initializeDemo, router])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Demo Data Reset</h1>
        
        {isResetting && (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p>Clearing cache and loading fresh Romeo & Juliet demo data...</p>
          </div>
        )}
        
        {isComplete && (
          <div className="space-y-2">
            <div className="text-green-400 text-2xl">✅</div>
            <p className="text-green-400">Demo data reset complete!</p>
            <p className="text-sm text-gray-400">Redirecting to Cue Notes...</p>
          </div>
        )}
      </div>
    </div>
  )
}