'use client'

import { PositionManager } from '@/components/position-manager'
import { useProductionOptional } from '@/components/production/production-provider'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function PositionsPage() {
  const pathname = usePathname()
  const productionContext = useProductionOptional()
  const productionId = productionContext?.productionId ?? 'prod-1'

  // Build base URL matching the current route context (demo, production, or default)
  const isDemoMode = pathname.startsWith('/demo')
  const isProductionMode = pathname.startsWith('/production/')
  const baseUrl = isDemoMode
    ? '/demo'
    : isProductionMode
      ? `/production/${productionContext?.productionId}`
      : ''

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`${baseUrl}/work-notes`}>
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
        <PositionManager productionId={productionId} />
      </div>
  )
}