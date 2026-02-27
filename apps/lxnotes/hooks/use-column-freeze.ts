'use client'

import { useMemo, useCallback, useRef, useState, useLayoutEffect } from 'react'
import { useColumnLayoutStore } from '@/lib/stores/column-layout-store'
import type { ModuleType } from '@/types'

interface FrozenStyle {
  position: 'sticky'
  left: number
  zIndex: number
}

interface UseColumnFreezeReturn {
  frozenCount: number
  freeze: (columnIndex: number) => void
  unfreeze: () => void
  headerRowRef: React.RefCallback<HTMLTableRowElement>
  getFrozenHeaderStyle: (columnIndex: number) => FrozenStyle | undefined
  getFrozenCellStyle: (columnIndex: number) => FrozenStyle | undefined
  isLastFrozen: (columnIndex: number) => boolean
}

export function useColumnFreeze(
  moduleType: ModuleType
): UseColumnFreezeReturn {
  const frozenCount = useColumnLayoutStore((s) => s.getFrozenCount(moduleType))
  const setFrozenCount = useColumnLayoutStore((s) => s.setFrozenCount)

  const rowElRef = useRef<HTMLTableRowElement | null>(null)
  const [measuredOffsets, setMeasuredOffsets] = useState<number[]>([])

  const headerRowRef = useCallback((el: HTMLTableRowElement | null) => {
    rowElRef.current = el
  }, [])

  // Measure actual rendered <th> widths and compute cumulative offsets
  useLayoutEffect(() => {
    const row = rowElRef.current
    if (!row) return

    const measure = () => {
      const ths = row.querySelectorAll<HTMLTableCellElement>(':scope > th')
      const offsets: number[] = []
      ths.forEach((th) => {
        offsets.push(th.offsetLeft)
      })
      setMeasuredOffsets((prev) => {
        // Avoid re-render if offsets haven't changed
        if (prev.length === offsets.length && prev.every((v, i) => v === offsets[i])) {
          return prev
        }
        return offsets
      })
    }

    measure()

    // Re-measure when columns are resized
    const observer = new ResizeObserver(measure)
    const ths = row.querySelectorAll<HTMLTableCellElement>(':scope > th')
    ths.forEach((th) => observer.observe(th))

    return () => observer.disconnect()
  })

  const freeze = useCallback(
    (columnIndex: number) => {
      setFrozenCount(moduleType, columnIndex + 1)
    },
    [moduleType, setFrozenCount]
  )

  const unfreeze = useCallback(() => {
    setFrozenCount(moduleType, 0)
  }, [moduleType, setFrozenCount])

  const getFrozenHeaderStyle = useCallback(
    (columnIndex: number): FrozenStyle | undefined => {
      if (columnIndex >= frozenCount) return undefined
      return {
        position: 'sticky',
        left: measuredOffsets[columnIndex] ?? 0,
        zIndex: 30,
      }
    },
    [frozenCount, measuredOffsets]
  )

  const getFrozenCellStyle = useCallback(
    (columnIndex: number): FrozenStyle | undefined => {
      if (columnIndex >= frozenCount) return undefined
      return {
        position: 'sticky',
        left: measuredOffsets[columnIndex] ?? 0,
        zIndex: 10,
      }
    },
    [frozenCount, measuredOffsets]
  )

  const isLastFrozen = useCallback(
    (columnIndex: number) => frozenCount > 0 && columnIndex === frozenCount - 1,
    [frozenCount]
  )

  return { frozenCount, freeze, unfreeze, headerRowRef, getFrozenHeaderStyle, getFrozenCellStyle, isLastFrozen }
}
