'use client'

import { OrderListPage } from '@/components/order-list/order-list-page'
import { useProductionOptional } from '@/components/production/production-provider'

export default function OrderListRoute() {
  const production = useProductionOptional()
  return <OrderListPage productionId={production?.productionId} />
}
