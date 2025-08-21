'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Settings, Save, Upload, Download, Mail, FileText, Palette } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        <div className="flex gap-1 border-b border-bg-tertiary">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'modules', label: 'Modules', icon: FileText },
            { id: 'presets', label: 'Presets', icon: Palette },
            { id: 'export', label: 'Export & Email', icon: Mail },
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
                      defaultValue="Hamlet"
                      className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Venue
                    </label>
                    <input
                      type="text"
                      defaultValue="Main Theater"
                      className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-bg-secondary p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Display Preferences</h2>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-primary">Dark Mode</p>
                    <p className="text-sm text-text-secondary">Optimized for theater environments</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-modules-production">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-primary">Tablet Mode</p>
                    <p className="text-sm text-text-secondary">Optimize layout for tablets</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-bg-tertiary">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-6">
              {['Cue Notes', 'Work Notes', 'Production Notes'].map((module, i) => (
                <div key={module} className="rounded-lg bg-bg-secondary p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      i === 0 ? 'bg-modules-cue' : i === 1 ? 'bg-modules-work' : 'bg-modules-production'
                    }`} />
                    {module}
                  </h2>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Priority Names
                      </label>
                      <input
                        type="text"
                        defaultValue="High, Medium, Low"
                        className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-modules-production"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Default Priority
                      </label>
                      <select className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-modules-production">
                        <option>Medium</option>
                        <option>High</option>
                        <option>Low</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Note Types
                      </label>
                      <input
                        type="text"
                        defaultValue="General, Technical, Creative"
                        className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-modules-production"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-bg-secondary p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Page Style Presets</h2>
                  <button className="text-sm text-modules-production hover:text-modules-production/80">
                    + Add Preset
                  </button>
                </div>
                <div className="space-y-2">
                  {['Letter Portrait', 'Letter Landscape', 'A4 Portrait'].map((preset) => (
                    <div key={preset} className="flex items-center justify-between py-2 px-3 rounded bg-bg-tertiary">
                      <span className="text-text-primary text-sm">{preset}</span>
                      <button className="text-text-muted hover:text-text-secondary text-sm">Edit</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-bg-secondary p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Filter & Sort Presets</h2>
                  <button className="text-sm text-modules-production hover:text-modules-production/80">
                    + Add Preset
                  </button>
                </div>
                <div className="space-y-2">
                  {['High Priority First', 'Recent Updates', 'By Department'].map((preset) => (
                    <div key={preset} className="flex items-center justify-between py-2 px-3 rounded bg-bg-tertiary">
                      <span className="text-text-primary text-sm">{preset}</span>
                      <button className="text-text-muted hover:text-text-secondary text-sm">Edit</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-bg-secondary p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Email Message Presets</h2>
                  <button className="text-sm text-modules-production hover:text-modules-production/80">
                    + Add Preset
                  </button>
                </div>
                <div className="space-y-2">
                  {['Daily Report', 'Tech Rehearsal Notes', 'Final Performance'].map((preset) => (
                    <div key={preset} className="flex items-center justify-between py-2 px-3 rounded bg-bg-tertiary">
                      <span className="text-text-primary text-sm">{preset}</span>
                      <button className="text-text-muted hover:text-text-secondary text-sm">Edit</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-bg-secondary p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Export Settings</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Default Export Format
                    </label>
                    <select className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production">
                      <option>PDF</option>
                      <option>CSV</option>
                      <option>Excel</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Include in Exports
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm text-text-primary">Completed Notes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm text-text-primary">Descriptions</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-bg-secondary p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Email Configuration</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Default Recipients
                    </label>
                    <textarea
                      placeholder="Enter email addresses, one per line"
                      className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-modules-production"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Email Signature
                    </label>
                    <textarea
                      defaultValue="Best regards,
LX Team"
                      className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-production"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-modules-production px-6 py-2 text-white hover:bg-modules-production/90 transition-colors"
          >
            <Save className="h-5 w-5" />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}