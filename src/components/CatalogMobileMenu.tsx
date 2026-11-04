'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { getRubros } from '@/services/rubros'
import { RubroNode } from '@/interfaces/rubros'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { isStaff } from '@/utils/auth'
import { useSwipeClose } from '../hooks/useSwipeClose'

// Función para ordenar recursivamente un array de RubroNode alfabéticamente
const sortRubrosAlphabetically = (items: RubroNode[]): RubroNode[] => {
  return [...items]
    .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
    .map(item => ({
      ...item,
      children: item.children ? sortRubrosAlphabetically(item.children) : undefined
    }))
}
export default function CatalogMobileMenu({
  onClose,
  onNavigate
}: {
  onClose: () => void
  onNavigate?: () => void
}) {
  const [rubros, setRubros] = useState<RubroNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] =
    useState<'category' | 'subtype' | 'brand'>('category')
  const [activeCategory, setActiveCategory] = useState<RubroNode | null>(null)
  const [activeSubtipo, setActiveSubtipo] = useState<RubroNode | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const [searchSubtype, setSearchSubtype] = useState('')
  const [searchBrand, setSearchBrand] = useState('')
  const { user, selectedClient } = useSelector((state: RootState) => state.auth)

  const nroctaParam = useMemo(() => {
    return isStaff(user) && selectedClient?.nrocta ? `&nrocta=${selectedClient.nrocta}` : ''
  }, [user, selectedClient])

  const swipeHandlers = useSwipeClose(onClose)
  useEffect(() => {
    let isMounted = true

    getRubros()
      .then(data => {
        if (isMounted) {
          setRubros(sortRubrosAlphabetically(data))
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
    if (!searchCategory.trim()) return rubros
    const q = searchCategory.toLowerCase()
    return rubros.filter(rubro => rubro.label.toLowerCase().includes(q))
  }, [rubros, searchCategory])
  const filteredSubtipos = useMemo(() => {
    if (!activeCategory) return []
    if (!searchSubtype.trim()) return activeCategory.children || []
    const q = searchSubtype.toLowerCase()
    return (activeCategory.children || []).filter(subtipo => subtipo.label.toLowerCase().includes(q))
  }, [activeCategory, searchSubtype])
  const allBrands = useMemo(() => {
    if (!activeCategory) return []
    const map = new Map<string, RubroNode>()
    activeCategory.children?.forEach(sub => {
      sub.children?.forEach(brand => {
        map.set(brand.id, brand)
      })
    })
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
  }, [activeCategory])
  const visibleBrands = useMemo(() => {
    let brands = activeSubtipo ? activeSubtipo.children || [] : allBrands
    if (searchBrand.trim()) {
      brands = brands.filter(b =>
        b.label.toLowerCase().includes(searchBrand.toLowerCase())
      )
    }
    return brands
  }, [activeSubtipo, allBrands, searchBrand])
  const headerTitle =
    step === 'category'
      ? 'Catálogo'
      : step === 'subtype'
        ? activeCategory?.label
        : activeSubtipo?.label || 'Todas las marcas'
  const goBack = () => {
    if (step === 'brand') {
      setStep('subtype')
      setActiveSubtipo(null)
      setSearchBrand('')
    } else if (step === 'subtype') {
      setStep('category')
      setActiveCategory(null)
      setSearchSubtype('')
    }
  }
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Cargando categorías...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[99998]"
      />
      <div
        {...swipeHandlers}
        className="
          fixed inset-y-0 right-0 w-full max-w-md
          bg-white text-gray-900
          z-[99999] shadow-2xl
          flex flex-col
        "
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          {step !== 'category' && (
            <button onClick={goBack} className="text-xl">
              ←
            </button>
          )}
          <span className="font-bold text-lg">
            {headerTitle}
          </span>
          <button onClick={onClose} className="ml-auto text-2xl">
            ✕
          </button>
        </div>
        <div className="flex-1 px-4 py-2 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'category' && (
              <motion.div
                key="category"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
              >
                <input
                  type="text"
                  placeholder="Buscar rubro..."
                  value={searchCategory}
                  onChange={e => setSearchCategory(e.target.value)}
                  className="
                    w-full mb-3 px-3 py-2 rounded
                    border text-sm
                  "
                />
                {filteredRubros.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat)
                      setStep('subtype')
                      setSearchCategory('')
                    }}
                    className="
                      w-full py-3 border-b
                      text-left font-medium
                      hover:bg-gray-50
                    "
                  >
                    {cat.label}
                  </button>
                ))}
              </motion.div>
            )}
            {step === 'subtype' && activeCategory && (
              <motion.div
                key="subtype"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
              >
                <input
                  type="text"
                  placeholder="Buscar subrubro..."
                  value={searchSubtype}
                  onChange={e => setSearchSubtype(e.target.value)}
                  className="
                    w-full mb-3 px-3 py-2 rounded
                    border text-sm
                  "
                />
                <button
                  onClick={() => {
                    setActiveSubtipo(null)
                    setStep('brand')
                    setSearchSubtype('')
                  }}
                  className="
                    w-full py-3 border-b
                    text-left font-semibold text-violet-700
                    hover:bg-violet-50
                  "
                >
                  Ver todas las marcas
                </button>
                {filteredSubtipos.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setActiveSubtipo(sub)
                      setStep('brand')
                      setSearchSubtype('')
                    }}
                    className="
                      w-full py-3 border-b
                      text-left hover:bg-gray-50
                    "
                  >
                    {sub.label}
                  </button>
                ))}
              </motion.div>
            )}
            {step === 'brand' && (
              <motion.div
                key="brand"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
              >
                <input
                  type="text"
                  placeholder="Buscar marca..."
                  value={searchBrand}
                  onChange={e => setSearchBrand(e.target.value)}
                  className="
                    w-full mb-3 px-3 py-2 rounded
                    border text-sm
                  "
                />
                {visibleBrands.map(brand => (
                  <Link
                    key={brand.id}
                    href={`/catalogo?tipo=${activeCategory?.label}${activeSubtipo ? `&subtipo=${activeSubtipo.label}` : ''}&marca=${brand.label}${nroctaParam}`}
                    onClick={() => {
                      onClose()
                      if (onNavigate) onNavigate()
                    }}
                    className="
                      block py-2 border-b
                      text-gray-700 hover:text-violet-700
                    "
                  >
                    {brand.label}
                  </Link>
                ))}
                {visibleBrands.length === 0 && (
                  <p className="text-sm text-gray-400 mt-4">
                    No se encontraron marcas
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
