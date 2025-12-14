import { ProductionProvider } from '@/components/production/production-provider'
import { ProductionBanner } from '@/components/production/production-banner'

export default async function ProductionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ProductionProvider productionId={id}>
      <ProductionBanner />
      {children}
    </ProductionProvider>
  )
}
