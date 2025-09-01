'use client'

import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { useDemoStore } from '@/lib/stores/demo-store'
import { DemoDataService } from '@/lib/services/demo-data-service'
import { useEffect, useState } from 'react'

export function DemoSection() {
  const router = useRouter()
  const initializeDemo = useDemoStore(state => state.initializeDemo)
  const [stats, setStats] = useState({
    lightingNotes: 15,
    scriptPages: 8,
    equipmentItems: 5,
    totalNotes: 25
  })

  useEffect(() => {
    // Get demo stats for display
    const demoStats = DemoDataService.getDemoStats()
    setStats(demoStats)
  }, [])

  const handleViewDemo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    // Direct navigation to demo page - let the page handle initialization
    window.location.href = '/cue-notes?demo=true'
  }

  const demoFeatures = [
    `Pre-loaded with ${stats.totalNotes} notes across all modules`,
    `${stats.scriptPages} script pages with scene titles`,
    'Fully functional interface',
    'Resets automatically for each visitor'
  ]

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 shadow-xl">
      <div className="flex items-center mb-4">
        <Play className="text-purple-400 w-6 h-6 mr-3" />
        <h2 className="text-white text-xl font-bold">
          Try the Demo
        </h2>
      </div>
      <p className="text-gray-400 mb-5 leading-relaxed">
        Explore Romeo & Juliet production with sample data
      </p>

      {/* Demo Features */}
      <ul className="space-y-3 mb-6">
        {demoFeatures.map((feature, index) => (
          <li key={index} className="flex items-start text-gray-300">
            <span className="text-purple-400 mr-3 mt-1 text-lg">•</span>
            <span className="leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Demo Button */}
      <button
        type="button"
        onClick={handleViewDemo}
        className="w-full bg-transparent hover:bg-gray-800/50 text-white font-semibold py-3 px-6 rounded-lg border border-gray-600 hover:border-purple-400 transition-all duration-200 flex items-center justify-center group hover:shadow-lg"
      >
        <Play className="w-4 h-4 mr-2 group-hover:text-purple-400 transition-colors" />
        View Demo
      </button>
    </div>
  )
}