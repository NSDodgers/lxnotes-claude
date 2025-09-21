'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Settings, Upload, Download, FileText, Palette, Lightbulb, Wrench, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useProductionStore, DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'
import { TypesManager } from '@/components/types-manager'
import { PrioritiesManager } from '@/components/priorities-manager'
import { PageStylePresetsManager } from '@/components/page-style-presets-manager'
import { FilterSortPresetsManager } from '@/components/filter-sort-presets-manager'
import { EmailMessagePresetsManager } from '@/components/email-message-presets-manager'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const { name, abbreviation, logo, updateProduction, clearLogo } = useProductionStore()
  const [logoPreview, setLogoPreview] = useState(logo)


  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setLogoPreview(result)
          updateProduction({ logo: result })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClearLogo = () => {
    clearLogo()
    setLogoPreview(DEFAULT_PRODUCTION_LOGO)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-bg-tertiary pb-6">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Settings className="h-8 w-8 text-text-secondary" />
            Settings
          </h1>
          <p className="mt-2 text-text-secondary">
            Configure your production and application preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-bg-tertiary overflow-x-auto">
          {[
            { id: 'general', label: 'Production Information', icon: Settings },
            { id: 'cue-notes', label: 'Cue Notes', icon: Lightbulb },
            { id: 'work-notes', label: 'Work Notes', icon: Wrench },
            { id: 'production-notes', label: 'Production Notes', icon: Users },
            { id: 'presets', label: 'Presets', icon: Palette },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-modules-production text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'general' && (
            <>
              <div className="rounded-lg bg-bg-secondary p-6 space-y-6">
                <h2 className="text-lg font-semibold text-text-primary">Production Information</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Production Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updateProduction({ name: e.target.value })}
                      className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Production Abbreviation
                    </label>
                    <input
                      type="text"
                      value={abbreviation}
                      onChange={(e) => updateProduction({ abbreviation: e.target.value })}
                      className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-bg-secondary p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Production Logo</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Upload Logo
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-bg-tertiary border-2 border-dashed border-bg-hover flex items-center justify-center text-text-muted overflow-hidden">
                        {logoPreview && (logoPreview.startsWith('data:') || logoPreview.startsWith('/') || logoPreview.startsWith('http')) ? (
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{logoPreview}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="flex-1 rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-modules-production file:text-white file:text-sm hover:file:bg-modules-production/90"
                          />
                          {logoPreview && logoPreview !== DEFAULT_PRODUCTION_LOGO && (
                            <button
                              onClick={handleClearLogo}
                              className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-1"
                              title="Clear logo"
                            >
                              <X className="h-4 w-4" />
                              Clear
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-1">Recommended: Square format (1:1 ratio) for best display</p>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </>
          )}

          {activeTab === 'cue-notes' && (
            <div className="space-y-8">
              <div className="rounded-lg bg-bg-secondary p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-3 w-3 rounded-full bg-modules-cue" />
                  <h2 className="text-xl font-semibold text-text-primary">Cue Notes Configuration</h2>
                </div>
                <div className="grid gap-8 lg:grid-cols-2">
                  <TypesManager moduleType="cue" />
                  <PrioritiesManager moduleType="cue" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'work-notes' && (
            <div className="space-y-8">
              <div className="rounded-lg bg-bg-secondary p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-3 w-3 rounded-full bg-modules-work" />
                  <h2 className="text-xl font-semibold text-text-primary">Work Notes Configuration</h2>
                </div>
                <div className="grid gap-8 lg:grid-cols-2">
                  <TypesManager moduleType="work" />
                  <PrioritiesManager moduleType="work" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'production-notes' && (
            <div className="space-y-8">
              <div className="rounded-lg bg-bg-secondary p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-3 w-3 rounded-full bg-modules-production" />
                  <h2 className="text-xl font-semibold text-text-primary">Production Notes Configuration</h2>
                </div>
                <div className="grid gap-8 lg:grid-cols-2">
                  <TypesManager moduleType="production" />
                  <PrioritiesManager moduleType="production" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-6">
              <PageStylePresetsManager />
              
              <FilterSortPresetsManager />
              
              <EmailMessagePresetsManager />
            </div>
          )}

        </div>

        {/* Auto-Save Info */}
        <div className="flex justify-center">
          <p className="text-sm text-text-secondary italic">
            All changes save automatically
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
