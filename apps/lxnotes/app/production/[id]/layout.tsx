import { ProductionProvider } from '@/components/production/production-provider'

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
      {children}
    </ProductionProvider>
  )
}
