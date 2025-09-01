'use client'

import Image from 'next/image'
import { AuthSection } from './auth-section'
import { DemoSection } from './demo-section'
import { PolicyFooter } from './policy-footer'

export function HomepageLayout() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-6xl w-full">
          {/* Logo */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Image
                  src="/lxnotes-logo-stacked.png"
                  alt="LX"
                  width={250}
                  height={250}
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional task management for lighting theatrical productions
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            <AuthSection />
            <DemoSection />
          </div>
        </div>
      </div>

      {/* Footer */}
      <PolicyFooter />
    </div>
  )
}