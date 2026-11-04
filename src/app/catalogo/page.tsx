import { Suspense } from 'react'
import CatalogGrid from '@/components/catalog/CatalogGrid'
import CatalogSkeleton from '@/components/catalog/CatalogSkeleton'
import SidebarFilters from '@/components/catalog/SidebarFilters'
import CatalogHeaderWrapper from '@/components/catalog/CatalogHeaderWrapper'

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{
    rubro?: string
    subtipo?: string
    tipo?: string
    marca?: string
    q?: string
    nombre?: string
    page?: string
    fabricante?: string
    modelo?: string
    cilindrada?: string
    version?: string
    sortBy?: string
    sortOrder?: string
    moneda?: string
  }>
}) {
  const params = await searchParams

  // Creamos una key única basada en los filtros para que Suspense
  // sepa que debe mostrar el fallback al cambiar de filtro
  const suspenseKey = JSON.stringify(params);

  // Calcular datos de paginación para el header
  const pageSize = 20
  const currentPage = Number(params.page || 1)

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f2f2] lg:flex-row lg:items-start">
      <SidebarFilters />
      <main className="min-w-0 flex-1">
        {/* CatalogHeader con filtros de moto y herramientas */}
        <CatalogHeaderWrapper
          totalProducts={0} // Se actualizará con datos reales del Grid
          currentPage={currentPage}
          pageSize={pageSize}
        />
        <div className="p-4 lg:p-6">
          <Suspense key={suspenseKey} fallback={<CatalogSkeleton />}>
            <CatalogGrid searchParams={params} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
