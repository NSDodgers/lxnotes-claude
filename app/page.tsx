import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Lightbulb, Wrench, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-bg-tertiary pb-6">
          <h1 className="text-3xl font-bold text-text-primary">Production Dashboard</h1>
          <p className="mt-2 text-text-secondary">
            Welcome to LX Notes - Manage your production notes efficiently
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-bg-secondary p-6 border border-bg-tertiary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">Cue Notes</p>
                <p className="text-2xl font-bold text-modules-cue">24</p>
                <p className="text-text-secondary text-sm mt-1">8 pending</p>
              </div>
              <Lightbulb className="h-8 w-8 text-modules-cue opacity-50" />
            </div>
          </div>

          <div className="rounded-lg bg-bg-secondary p-6 border border-bg-tertiary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">Work Notes</p>
                <p className="text-2xl font-bold text-modules-work">18</p>
                <p className="text-text-secondary text-sm mt-1">5 pending</p>
              </div>
              <Wrench className="h-8 w-8 text-modules-work opacity-50" />
            </div>
          </div>

          <div className="rounded-lg bg-bg-secondary p-6 border border-bg-tertiary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">Production Notes</p>
                <p className="text-2xl font-bold text-modules-production">32</p>
                <p className="text-text-secondary text-sm mt-1">12 pending</p>
              </div>
              <FileText className="h-8 w-8 text-modules-production opacity-50" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/cue-notes"
              className="group rounded-lg bg-bg-secondary p-6 border border-bg-tertiary hover:border-modules-cue transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-modules-cue/20 p-3 group-hover:bg-modules-cue/30 transition-colors">
                  <Lightbulb className="h-6 w-6 text-modules-cue" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">Add Cue Note</h3>
                  <p className="text-sm text-text-secondary">Create lighting cue notes</p>
                </div>
                <Plus className="ml-auto h-5 w-5 text-text-muted" />
              </div>
            </Link>

            <Link
              href="/work-notes"
              className="group rounded-lg bg-bg-secondary p-6 border border-bg-tertiary hover:border-modules-work transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-modules-work/20 p-3 group-hover:bg-modules-work/30 transition-colors">
                  <Wrench className="h-6 w-6 text-modules-work" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">Add Work Note</h3>
                  <p className="text-sm text-text-secondary">Track equipment tasks</p>
                </div>
                <Plus className="ml-auto h-5 w-5 text-text-muted" />
              </div>
            </Link>

            <Link
              href="/production-notes"
              className="group rounded-lg bg-bg-secondary p-6 border border-bg-tertiary hover:border-modules-production transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-modules-production/20 p-3 group-hover:bg-modules-production/30 transition-colors">
                  <FileText className="h-6 w-6 text-modules-production" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">Add Production Note</h3>
                  <p className="text-sm text-text-secondary">Cross-department notes</p>
                </div>
                <Plus className="ml-auto h-5 w-5 text-text-muted" />
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Recent Activity</h2>
          <div className="rounded-lg bg-bg-secondary border border-bg-tertiary">
            <div className="p-4 space-y-3">
              {[
                { time: '2 hours ago', action: 'Completed', note: 'Fade house lights on page 23', type: 'cue' },
                { time: '3 hours ago', action: 'Added', note: 'Check DMX cable run stage left', type: 'work' },
                { time: '5 hours ago', action: 'Updated', note: 'Coordinate with sound for Act 2 transitions', type: 'production' },
                { time: '1 day ago', action: 'Completed', note: 'Replace lamp in FOH position 3', type: 'work' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-bg-tertiary last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      activity.type === 'cue' && 'bg-modules-cue',
                      activity.type === 'work' && 'bg-modules-work',
                      activity.type === 'production' && 'bg-modules-production'
                    )} />
                    <div>
                      <p className="text-text-primary text-sm">
                        <span className="font-medium">{activity.action}</span> - {activity.note}
                      </p>
                      <p className="text-text-muted text-xs">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}