'use client'

export function OrderListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary bar skeleton */}
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4 flex items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-16 bg-bg-tertiary rounded" />
          <div className="h-6 w-10 bg-bg-tertiary rounded" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-14 bg-bg-tertiary rounded" />
          <div className="h-6 w-8 bg-bg-tertiary rounded" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-18 bg-bg-tertiary rounded" />
          <div className="h-6 w-8 bg-bg-tertiary rounded" />
        </div>
        <div className="flex-1 h-1.5 bg-bg-tertiary rounded" />
      </div>

      {/* Card skeletons */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-bg-secondary border border-bg-tertiary rounded-lg p-3 border-l-[3px] border-l-bg-tertiary">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 bg-bg-tertiary rounded" />
              <div className="h-4 w-16 bg-bg-tertiary rounded" />
              <div className="h-4 w-24 bg-bg-tertiary rounded" />
            </div>
            <div className="h-3 w-12 bg-bg-tertiary rounded" />
          </div>
          <div className="space-y-2 border-t border-bg-tertiary pt-2">
            {[1, 2].map(j => (
              <div key={j} className="flex items-center gap-2.5">
                <div className="h-4 w-4 bg-bg-tertiary rounded" />
                <div className="h-3.5 bg-bg-tertiary rounded" style={{ width: `${50 + j * 20}%` }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
