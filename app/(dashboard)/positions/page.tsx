'use client'

import { PositionManager } from '@/components/position-manager'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PositionsPage() {
  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/work-notes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Notes
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Position Management</h1>
            <p className="text-muted-foreground">
              Customize the sort order of positions from your fixture data
            </p>
          </div>
        </div>

        {/* Position Manager */}
        <PositionManager />
      </div>
  )
}