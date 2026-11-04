'use client'
import { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { isStaff } from '@/utils/auth'
import Link from 'next/link'
import { getRubros } from '@/services/rubros'
import { RubroNode } from '@/interfaces/rubros'

// Función para ordenar recursivamente un array de RubroNode alfabéticamente
const sortRubrosAlphabetically = (items: RubroNode[]): RubroNode[] => {
  return [...items]
    .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
    .map(item => ({
      ...item,
      children: item.children ? sortRubrosAlphabetically(item.children) : undefined
    }))
}
interface CatalogMegaMenuProps {
  onNavigate?: () => void
}
export default function CatalogMegaMenu({ onNavigate }: CatalogMegaMenuProps) {
  const [rubros, setRubros] = useState<RubroNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<RubroNode | null>(null)
  const [hoveredSubtipo, setHoveredSubtipo] = useState<RubroNode | null>(null)
  const [search, setSearch] = useState('')

  const { user, selectedClient } = useSelector((state: RootState) => state.auth)

  const nroctaParam = useMemo(() => {
    return isStaff(user) && selectedClient?.nrocta ? `&nrocta=${selectedClient.nrocta}` : ''
  }, [user, selectedClient])

  useEffect(() => {
    let isMounted = true

    getRubros()
      .then(data => {
        if (isMounted) {
          const sortedData = sortRubrosAlphabetically(data)
          setRubros(sortedData)
          setActiveCategory(sortedData[0] ?? null)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Error cargando categorías')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])
  const filteredRubros = useMemo(() => {
    if (!search.trim()) return rubros
    const q = search.toLowerCase()
    return rubros.filter(rubro =>
      rubro.label.toLowerCase().includes(q) ||
      rubro.children?.some(subtipo =>
        subtipo.label.toLowerCase().includes(q) ||
        subtipo.children?.some(marca =>
          marca.label.toLowerCase().includes(q)
        )
      )
    )
  }, [rubros, search])
  useEffect(() => {
    if (search.trim() && activeCategory && !filteredRubros.some(r => r.id === activeCategory.id)) {
      setActiveCategory(filteredRubros[0] ?? null)
      setHoveredSubtipo(null)
    }
  }, [search, activeCategory, filteredRubros])
  const allBrands = useMemo(() => {
    if (!activeCategory) return []
    const map = new Map<string, RubroNode>()
    activeCategory.children?.forEach(subtipo => {
      subtipo.children?.forEach(marca => {
        map.set(marca.id, marca)
      })
    })
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
  }, [activeCategory])
  const visibleSubtipos = useMemo(() => {
    if (!activeCategory) return []
    if (!search.trim()) return activeCategory.children || []
    const q = search.toLowerCase()
    return (activeCategory.children || []).filter(subtipo =>
      subtipo.label.toLowerCase().includes(q) ||
      subtipo.children?.some(marca =>
        marca.label.toLowerCase().includes(q)
      )
    )
  }, [activeCategory, search])
  const visibleBrands = useMemo(() => {
    let brands = hoveredSubtipo
      ? hoveredSubtipo.children || []
      : allBrands
    if (search.trim()) {
      const q = search.toLowerCase()
      brands = brands.filter(b =>
        b.label.toLowerCase().includes(q)
      )
    }
    return brands
  }, [hoveredSubtipo, allBrands, search])
  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate()
    }
  }
  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Cargando categorías...
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">
        {error}
      </div>
    )
  }
  return (
    <div
      className="
        absolute top-full left-1/2 -translate-x-1/2
        w-[1100px]
        bg-white shadow-2xl rounded-xl p-6
        z-[99999]
      "
      role="menu"
    >
      { }
      <div className="col-span-12 mb-4">
        <input
          type="text"
          placeholder="Buscar por rubro, subrubro o marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div className="grid grid-cols-12 gap-6">
        { }
        <div className="col-span-3 border-r pr-4 max-h-[420px] overflow-y-auto">
          <h4 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
            Categorías
          </h4>
          <ul className="space-y-1">
            {filteredRubros.map(cat => (
              <li
                key={cat.id}
                onMouseEnter={() => {
                  setActiveCategory(cat)
                  setHoveredSubtipo(null)
                }}
                className={`
    px-3 py-2 rounded transition-colors
    ${activeCategory?.id === cat.id
                    ? 'bg-gray-100 font-semibold text-black'
                    : 'hover:bg-gray-50 text-gray-800'}
  `}
              >
                <Link
                  href={`/catalogo?tipo=${cat.label}${nroctaParam}`}
                  className="block w-full h-full"
                  onClick={handleNavigate}
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        { }
        <div className="col-span-4 overflow-hidden">
          {activeCategory && (
            <div className="max-h-[420px] overflow-y-auto pr-2">
              <h4 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
                {activeCategory.label}
              </h4>
              <ul className="space-y-1">
                {visibleSubtipos.map(subtipo => (
                  <li
                    key={subtipo.id}
                    role="menuitem"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredSubtipo(subtipo)}
                    onFocus={() => setHoveredSubtipo(subtipo)}
                    className={`
                      cursor-pointer px-3 py-2 rounded
                      transition-colors
                      ${hoveredSubtipo?.id === subtipo.id
                        ? 'bg-gray-100 font-semibold text-black'
                        : 'hover:bg-gray-50 text-gray-800'}
                    `}
                  >
                    <Link
                      href={`/catalogo?subtipo=${subtipo.label}${nroctaParam}`}
                      className="block w-full h-full"
                      onClick={handleNavigate}
                    >
                      {subtipo.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        { }
        <div className="col-span-5 overflow-hidden">
          {activeCategory && (
            <div className="max-h-[420px] overflow-y-auto pr-2">
              <h4 className="mb-2 text-sm font-semibold text-gray-500 uppercase">
                {hoveredSubtipo
                  ? hoveredSubtipo.label
                  : 'Todas las marcas'}
              </h4>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                {visibleBrands.map(brand => (
                  <li key={brand.id}>
                    <Link
                      href={`/catalogo?tipo=${activeCategory.label}${hoveredSubtipo ? `&subtipo=${hoveredSubtipo.label}` : ''}&marca=${brand.label}${nroctaParam}`}
                      className="block py-1 text-gray-700 hover:text-violet-700"
                      onClick={handleNavigate}
                    >
                      {brand.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {visibleBrands.length === 0 && (
                <p className="text-sm text-gray-400 mt-4">
                  No se encontraron marcas
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
