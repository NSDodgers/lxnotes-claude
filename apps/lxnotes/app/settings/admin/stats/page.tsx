'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  Shield,
  Loader2,
  RefreshCw,
  Film,
  Users,
  StickyNote,
  Lightbulb,
  Camera,
  FileText,
  Mail,
  Zap,
  Clock,
  Trophy,
  Calendar,
  Building2,
  ArrowRightLeft,
  UserPlus,
  Star,
  TrendingUp,
  Hash,
} from 'lucide-react'
import { useAuthContext } from '@/components/auth/auth-provider'

// Module and status color mappings per CLAUDE.md conventions
const MODULE_COLORS: Record<string, { dot: string; bar: string; label: string }> = {
  cue: { dot: 'bg-modules-cue', bar: 'bg-modules-cue', label: 'Cue Notes' },
  work: { dot: 'bg-modules-work', bar: 'bg-modules-work', label: 'Work Notes' },
  production: { dot: 'bg-modules-production', bar: 'bg-modules-production', label: 'Production Notes' },
  electrician: { dot: 'bg-yellow-500', bar: 'bg-yellow-500', label: 'Electrician Notes' },
}

const STATUS_COLORS: Record<string, { dot: string; bar: string; label: string }> = {
  todo: { dot: 'bg-blue-500', bar: 'bg-blue-500', label: 'To Do' },
  review: { dot: 'bg-yellow-500', bar: 'bg-yellow-500', label: 'Review' },
  complete: { dot: 'bg-green-500', bar: 'bg-green-500', label: 'Complete' },
  cancelled: { dot: 'bg-gray-500', bar: 'bg-gray-500', label: 'Cancelled' },
}

const PRIORITY_COLORS: Record<string, { dot: string; bar: string; label: string }> = {
  critical: { dot: 'bg-red-700', bar: 'bg-red-700', label: 'Critical' },
  very_high: { dot: 'bg-red-500', bar: 'bg-red-500', label: 'Very High' },
  high: { dot: 'bg-red-400', bar: 'bg-red-400', label: 'High' },
  medium_high: { dot: 'bg-orange-400', bar: 'bg-orange-400', label: 'Medium High' },
  medium: { dot: 'bg-orange-500', bar: 'bg-orange-500', label: 'Medium' },
  medium_low: { dot: 'bg-yellow-500', bar: 'bg-yellow-500', label: 'Medium Low' },
  low: { dot: 'bg-green-500', bar: 'bg-green-500', label: 'Low' },
  very_low: { dot: 'bg-green-400', bar: 'bg-green-400', label: 'Very Low' },
  none: { dot: 'bg-gray-500', bar: 'bg-gray-500', label: 'None' },
}

interface StatsData {
  overview: {
    productions: number
    productions_total: number
    productions_trashed: number
    users: number
    notes: number
    fixtures: number
    snapshots: number
    script_pages: number
  }
  notes_by_module: Record<string, number>
  notes_by_status: Record<string, number>
  notes_by_priority: Record<string, number>
  activity_timeline: Array<{ date: string; count: number }>
  busiest_day: { date: string; count: number } | null
  production_leaderboard: Array<{
    id: string
    name: string
    abbreviation: string
    notes: number
    members: number
    fixtures: number
  }>
  user_leaderboard: Array<{
    email: string
    full_name: string | null
    notes: number
    productions: number
  }>
  invitation_stats: {
    total: number
    pending: number
    accepted: number
    expired: number
    cancelled: number
    avg_acceptance_hours: number | null
    fastest_acceptance_minutes: number | null
  }
  completion_rate: number | null
  avg_notes_per_production: number | null
  avg_members_per_production: number | null
  newest_user: { email: string; created_at: string } | null
  oldest_production: { name: string; created_at: string } | null
  total_departments: number
  total_note_transfers: number
  last_snapshot_at: string | null
  last_activity_at: string | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function BreakdownCard({
  title,
  data,
  colorMap,
}: {
  title: string
  data: Record<string, number>
  colorMap: Record<string, { dot: string; bar: string; label: string }>
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">{title}</h3>
      <div className="space-y-2.5">
        {entries.map(([key, count]) => {
          const colors = colorMap[key] ?? { dot: 'bg-gray-500', bar: 'bg-gray-500', label: key }
          const pct = (count / total) * 100
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-text-primary">
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  {colors.label}
                </span>
                <span className="text-text-secondary">
                  {count} <span className="text-text-muted">({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  subText,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  subText?: string
}) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-text-secondary mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {subText && <div className="text-xs text-text-muted mt-1">{subText}</div>}
    </div>
  )
}

const RANK_STYLES = ['text-yellow-400', 'text-gray-400', 'text-amber-600']

export default function AdminStatsPage() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuthContext()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        setStats(await response.json())
      } else {
        const body = await response.json().catch(() => ({}))
        setError(`${response.status}: ${body.error ?? response.statusText}`)
        console.error('Stats API error:', response.status, body)
      }
    } catch (err) {
      setError(String(err))
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user && isSuperAdmin) {
      fetchStats()
    }
  }, [authLoading, user, isSuperAdmin, fetchStats])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    )
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">This page is only accessible to super administrators.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-modules-production hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-2">Failed to load stats.</p>
          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
          <button
            onClick={() => { setIsLoading(true); fetchStats() }}
            className="mt-4 px-4 py-2 bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { overview } = stats
  const maxTimeline = Math.max(...(stats.activity_timeline.map(d => d.count)), 1)

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/settings/admin" className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-text-secondary" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-yellow-500" />
                System Stats
              </h1>
              <p className="text-text-secondary mt-1">Platform-wide analytics</p>
            </div>
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-tertiary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Row 1: Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <OverviewCard
            icon={Film}
            label="Productions"
            value={overview.productions}
            subText={`${overview.productions_trashed} trashed`}
          />
          <OverviewCard icon={Users} label="Users" value={overview.users} />
          <OverviewCard
            icon={StickyNote}
            label="Notes"
            value={overview.notes}
            subText={stats.completion_rate != null ? `${stats.completion_rate}% complete` : undefined}
          />
          <OverviewCard icon={Lightbulb} label="Fixtures" value={overview.fixtures} />
          <OverviewCard icon={FileText} label="Script Pages" value={overview.script_pages} />
          <OverviewCard
            icon={Camera}
            label="Snapshots"
            value={overview.snapshots}
            subText={stats.last_snapshot_at ? formatRelative(stats.last_snapshot_at) : 'none yet'}
          />
        </div>

        {/* Row 2: Notes Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <BreakdownCard title="Notes by Module" data={stats.notes_by_module} colorMap={MODULE_COLORS} />
          <BreakdownCard title="Notes by Status" data={stats.notes_by_status} colorMap={STATUS_COLORS} />
          <BreakdownCard title="Notes by Priority" data={stats.notes_by_priority} colorMap={PRIORITY_COLORS} />
        </div>

        {/* Row 3: Activity Timeline */}
        {stats.activity_timeline.length > 0 && (
          <div className="bg-bg-secondary rounded-lg border border-border p-4 mb-6">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Activity (Last 30 Days)</h3>
            <div className="flex items-end gap-[2px] h-32">
              {stats.activity_timeline.map((day) => {
                const height = (day.count / maxTimeline) * 100
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-modules-production rounded-t hover:bg-modules-production/80 transition-colors min-w-[4px]"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${formatDate(day.date)}: ${day.count} notes`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-text-muted">
              <span>{stats.activity_timeline.length > 0 ? formatDate(stats.activity_timeline[0].date) : ''}</span>
              <span>{stats.activity_timeline.length > 0 ? formatDate(stats.activity_timeline[stats.activity_timeline.length - 1].date) : ''}</span>
            </div>
          </div>
        )}

        {/* Row 4: Invitation Funnel + Fun Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Invitation Funnel */}
          <div className="bg-bg-secondary rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Invitations
            </h3>
            {stats.invitation_stats.total > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{stats.invitation_stats.total}</div>
                    <div className="text-xs text-text-muted">Total sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {stats.invitation_stats.total > 0
                        ? `${Math.round((stats.invitation_stats.accepted / stats.invitation_stats.total) * 100)}%`
                        : '0%'}
                    </div>
                    <div className="text-xs text-text-muted">Acceptance rate</div>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">{stats.invitation_stats.pending} pending</span>
                  <span className="px-2 py-1 rounded bg-green-500/10 text-green-400">{stats.invitation_stats.accepted} accepted</span>
                  <span className="px-2 py-1 rounded bg-gray-500/10 text-gray-400">{stats.invitation_stats.expired} expired</span>
                  {stats.invitation_stats.cancelled > 0 && (
                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-400">{stats.invitation_stats.cancelled} cancelled</span>
                  )}
                </div>
                {stats.invitation_stats.avg_acceptance_hours != null && (
                  <div className="flex gap-4 text-sm text-text-secondary pt-1 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Avg: {stats.invitation_stats.avg_acceptance_hours}h
                    </span>
                    {stats.invitation_stats.fastest_acceptance_minutes != null && (
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-400" />
                        Fastest: {stats.invitation_stats.fastest_acceptance_minutes}m
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No invitations yet.</p>
            )}
          </div>

          {/* Fun Stats */}
          <div className="bg-bg-secondary rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Fun Facts
            </h3>
            <div className="space-y-2.5 text-sm">
              {stats.busiest_day && (
                <div className="flex items-center gap-2 text-text-primary">
                  <Calendar className="h-4 w-4 text-text-muted shrink-0" />
                  <span>Busiest day: <strong>{formatDate(stats.busiest_day.date)}</strong> ({stats.busiest_day.count} notes)</span>
                </div>
              )}
              {stats.avg_notes_per_production != null && (
                <div className="flex items-center gap-2 text-text-primary">
                  <TrendingUp className="h-4 w-4 text-text-muted shrink-0" />
                  <span><strong>{stats.avg_notes_per_production}</strong> avg notes/production</span>
                </div>
              )}
              {stats.avg_members_per_production != null && (
                <div className="flex items-center gap-2 text-text-primary">
                  <UserPlus className="h-4 w-4 text-text-muted shrink-0" />
                  <span><strong>{stats.avg_members_per_production}</strong> avg members/production</span>
                </div>
              )}
              {stats.total_departments > 0 && (
                <div className="flex items-center gap-2 text-text-primary">
                  <Building2 className="h-4 w-4 text-text-muted shrink-0" />
                  <span><strong>{stats.total_departments}</strong> departments</span>
                </div>
              )}
              {stats.total_note_transfers > 0 && (
                <div className="flex items-center gap-2 text-text-primary">
                  <ArrowRightLeft className="h-4 w-4 text-text-muted shrink-0" />
                  <span><strong>{stats.total_note_transfers}</strong> note transfers</span>
                </div>
              )}
              {stats.newest_user && (
                <div className="flex items-center gap-2 text-text-primary">
                  <Users className="h-4 w-4 text-text-muted shrink-0" />
                  <span>Newest user: <strong>{stats.newest_user.email}</strong> ({formatRelative(stats.newest_user.created_at)})</span>
                </div>
              )}
              {stats.oldest_production && (
                <div className="flex items-center gap-2 text-text-primary">
                  <Film className="h-4 w-4 text-text-muted shrink-0" />
                  <span>Oldest: <strong>{stats.oldest_production.name}</strong> ({formatDate(stats.oldest_production.created_at)})</span>
                </div>
              )}
              {stats.last_activity_at && (
                <div className="flex items-center gap-2 text-text-primary">
                  <Hash className="h-4 w-4 text-text-muted shrink-0" />
                  <span>Last activity: <strong>{formatRelative(stats.last_activity_at)}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: Leaderboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Production Leaderboard */}
          <div className="bg-bg-secondary rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Top Productions
            </h3>
            {stats.production_leaderboard.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-xs">
                    <th className="text-left pb-2 w-8">#</th>
                    <th className="text-left pb-2">Name</th>
                    <th className="text-right pb-2">Notes</th>
                    <th className="text-right pb-2">Members</th>
                    <th className="text-right pb-2">Fixtures</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.production_leaderboard.slice(0, 10).map((p, i) => (
                    <tr key={p.id} className="border-t border-border/50">
                      <td className={`py-1.5 font-bold ${RANK_STYLES[i] ?? 'text-text-muted'}`}>{i + 1}</td>
                      <td className="py-1.5 text-text-primary font-medium truncate max-w-[200px]">{p.name}</td>
                      <td className="py-1.5 text-right text-text-secondary">{p.notes}</td>
                      <td className="py-1.5 text-right text-text-secondary">{p.members}</td>
                      <td className="py-1.5 text-right text-text-secondary">{p.fixtures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-text-muted text-sm">No productions yet.</p>
            )}
          </div>

          {/* User Leaderboard */}
          <div className="bg-bg-secondary rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Top Users
            </h3>
            {stats.user_leaderboard.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-xs">
                    <th className="text-left pb-2 w-8">#</th>
                    <th className="text-left pb-2">User</th>
                    <th className="text-right pb-2">Notes</th>
                    <th className="text-right pb-2">Productions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.user_leaderboard.slice(0, 10).map((u, i) => (
                    <tr key={u.email} className="border-t border-border/50">
                      <td className={`py-1.5 font-bold ${RANK_STYLES[i] ?? 'text-text-muted'}`}>{i + 1}</td>
                      <td className="py-1.5 text-text-primary truncate max-w-[200px]" title={u.email}>
                        {u.full_name || u.email}
                      </td>
                      <td className="py-1.5 text-right text-text-secondary">{u.notes}</td>
                      <td className="py-1.5 text-right text-text-secondary">{u.productions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-text-muted text-sm">No users yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
