'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, X, Menu } from 'lucide-react'
import { useSidebarData } from '@/hooks/useSidebarData'
import { useRubroCascadeFilters } from '@/hooks/useRubroCascadeFilters'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { isStaff } from '@/utils/auth'
import { RubroNode } from '@/interfaces/rubros'
import { getHeaders } from '@/services/products'
import {
    appendAttrParamsToSearchParams,
    attrParamsDependencyKey,
    attrSuffixFromUrlParamKey,
    attrUrlParamKey,
    deleteAttrParamsForDisplayName,
    findAttrDisplayName,
    findAttrUrlParamKeyInSearchParams,
    getAttrParamValue,
    isAttrParamSelected,
    isAttrValueAllowedInFacets,
    isAttrValueEqual,
} from '@/utils/attrFilterParams'

export default function SidebarFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const attrDeps = attrParamsDependencyKey(searchParams)

    const { user, selectedClient, isLoggedIn } = useSelector((state: RootState) => state.auth)

    const sidebarQueryParams = useMemo(() => {
        if (!searchParams) return undefined
        const params: Record<string, string | number | boolean | undefined | null> = {}
        const q = searchParams.get('q') || searchParams.get('query') || searchParams.get('search')
        if (q) params.q = q
        const tippro = searchParams.get('tippro')
        if (tippro) params.tippro = tippro
        const artcod = searchParams.get('artcod')
        if (artcod) params.artcod = artcod
        const fabricante = searchParams.get('fabricante') || searchParams.get('appFabricante')
        if (fabricante) params.appFabricante = fabricante
        const modelo = searchParams.get('modelo') || searchParams.get('appModelo')
        if (modelo) params.appModelo = modelo
        const cilindrada = searchParams.get('cilindrada') || searchParams.get('appCilindrada')
        if (cilindrada) params.appCilindrada = cilindrada
        const version = searchParams.get('version') || searchParams.get('appVersion')
        if (version) params.appVersion = version
        const anio = searchParams.get('anio') || searchParams.get('ano') || searchParams.get('annios')
        if (anio) params.annios = anio
        const anoDesde = searchParams.get('appAnoDesde')
        if (anoDesde) params.appAnoDesde = Number(anoDesde)
        const anoHasta = searchParams.get('appAnoHasta')
        if (anoHasta) params.appAnoHasta = Number(anoHasta)
        if (searchParams.get('ofertas') === 'true') params.ofertas = true
        if (searchParams.get('novedades') === 'true') params.novedades = true
        if (searchParams.get('stockDisponible') === 'true') params.stockDisponible = true
        if (searchParams.get('variacionPrecio') === 'true') params.variacionPrecio = true
        if (searchParams.get('stockBue') === 'true') params.stockBue = true
        if (searchParams.get('stockCuy') === 'true') params.stockCuy = true
        if (searchParams.get('stockNea') === 'true') params.stockNea = true
        if (searchParams.get('stockNoa') === 'true') params.stockNoa = true
        const nroPool = searchParams.get('nroPool')
        if (nroPool) params.nroPool = Number(nroPool)

        return Object.keys(params).length > 0 ? params : undefined
    }, [searchParams])

    const { tipos: tiposData, todosLosSubtipos, todasLasMarcas } = useSidebarData(
        sidebarQueryParams,
        getHeaders()
    )
    // Usar 'rubros' como alias de 'tipos' para mantener compatibilidad
    const tipos = tiposData
    const rubros = tiposData
    const [isOpenMobile, setIsOpenMobile] = useState(false)
    const [searchMarca, setSearchMarca] = useState('')
    const [searchCategoria, setSearchCategoria] = useState('')
    const [searchSubtipo, setSearchSubtipo] = useState('')

    const {
        selectedRubro,
        selectedSubtipo,
        selectedMarca,
        rubrosFiltrados,
        subtiposFiltrados,
        marcasFiltradas,
        selectRubro,
        selectSubtipo,
        selectMarca,
        resetFilters: resetCascadeFilters,
        setSelectedRubro,
        setSelectedSubtipo,
        setSelectedMarca,
    } = useRubroCascadeFilters({
        tipos,
        rubros,
        todosLosSubtipos,
        todasLasMarcas,
        searchCategoria,
        searchSubtipo,
        searchMarca,
        externalFilters: {
            tipo: searchParams?.get('tipo') || searchParams?.get('rubro') || null,
            subtipo: searchParams?.get('subtipo') || null,
            marca: searchParams?.get('marca') || null,
        },
    })

    // Estado para atributos filtrables
    const [atributosData, setAtributosData] = useState<Record<string, string[]>>({})
    const [selectedAtributos, setSelectedAtributos] = useState<Record<string, string>>({})
    const [loadingAtributos, setLoadingAtributos] = useState(false)

    // Helper para asegurar que nrocta esté en los params si es necesario
    const appendNrocta = (params: URLSearchParams) => {
        if (isStaff(user) && selectedClient?.nrocta && !params.has('nrocta')) {
            params.set('nrocta', selectedClient.nrocta)
        }
        return params
    }

    const isFlagOn = (key: string) => searchParams?.get(key) === 'true'

    /** Estado (exclusivo): ofertas | novedades | stockDisponible | variacionPrecio */
    const ESTADO_FLAGS = ['ofertas', 'novedades', 'stockDisponible', 'variacionPrecio'] as const

    /** Stock por sucursal: checkboxes independientes (OR en backend, combinables con ESTADO). */
    const STOCK_BRANCHES = [
        { key: 'stockBue', label: 'EN STOCK BUE' },
        { key: 'stockCuy', label: 'EN STOCK CUYO' },
        { key: 'stockNea', label: 'EN STOCK NEA' },
        { key: 'stockNoa', label: 'EN STOCK NOA' },
    ] as const

    const selectExclusiveFlag = (key: string, group: readonly string[]) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        const alreadyOn = params.get(key) === 'true'
        for (const k of group) {
            params.delete(k)
        }
        // Re-click deselecciona (igual que radio “ninguno”)
        if (!alreadyOn) {
            params.set(key, 'true')
        }
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
    }

    const toggleStockBranch = (key: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        if (params.get(key) === 'true') {
            params.delete(key)
        } else {
            params.set(key, 'true')
        }
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
    }

    // Función para manejar la selección de atributos
    const handleAtributoSelect = (attrName: string, attrValue: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        const paramKey = attrUrlParamKey(attrName)
        if (!paramKey) return

        const currentValue = getAttrParamValue(attrName, searchParams)
        deleteAttrParamsForDisplayName(params, attrName)

        if (!currentValue || !isAttrValueEqual(currentValue, attrValue)) {
            params.set(paramKey, attrValue)
        }

        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
    }

    // Cargar atributos filtrables (cascada: incluye attr_* activos en la URL y scope moto/búsqueda)
    useEffect(() => {
        const tipoParam = searchParams?.get('tipo') || searchParams?.get('rubro')
        const subtipoParam = searchParams?.get('subtipo')
        const marcaParam = searchParams?.get('marca')

        if (tipoParam || subtipoParam || marcaParam || sidebarQueryParams) {
            setLoadingAtributos(true)
            const params = new URLSearchParams()
            if (tipoParam) params.set('tipo', tipoParam)
            if (subtipoParam) params.set('subtipo', subtipoParam)
            if (marcaParam) params.set('marca', marcaParam)
            if (sidebarQueryParams) {
                Object.entries(sidebarQueryParams).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== '') {
                        params.set(k, String(v))
                    }
                })
            }
            appendAttrParamsToSearchParams(params, searchParams)

            fetch(
                `${process.env.NEXT_PUBLIC_API_BACKEND}/api/public/productos/atributos-filtrables?${params.toString()}`,
                { headers: getHeaders() }
            )
                .then(res => res.json())
                .then(data => {
                    const facetData: Record<string, string[]> = data || {}
                    setAtributosData(facetData)

                    const facetNames = Object.keys(facetData)
                    let needsPrune = false
                    const paramsToFix = new URLSearchParams(searchParams?.toString() || '')
                    searchParams?.forEach((value, key) => {
                        if (!key.startsWith('attr_')) return
                        if (isAttrValueAllowedInFacets(facetData, key, value)) {
                            return
                        }
                        const displayName = findAttrDisplayName(attrSuffixFromUrlParamKey(key), facetNames)
                        paramsToFix.delete(key)
                        paramsToFix.delete(`attr_${displayName}`)
                        needsPrune = true
                    })
                    if (needsPrune && pathname) {
                        paramsToFix.set('page', '1')
                        router.replace(`${pathname}?${appendNrocta(paramsToFix).toString()}`, { scroll: false })
                    }
                    setLoadingAtributos(false)
                })
                .catch(err => {
                    console.error('Error cargando atributos:', err)
                    setLoadingAtributos(false)
                })
        } else {
            setAtributosData({})
        }
    }, [
        searchParams?.get('tipo'),
        searchParams?.get('rubro'),
        searchParams?.get('subtipo'),
        searchParams?.get('marca'),
        sidebarQueryParams,
        attrDeps,
        pathname,
        router,
    ])

    // Sincronizar atributos desde la URL (claves = nombre de facet para UI)
    useEffect(() => {
        const attrs: Record<string, string> = {}
        const facetNames = Object.keys(atributosData)
        searchParams?.forEach((value, key) => {
            if (key.startsWith('attr_')) {
                const displayName = findAttrDisplayName(attrSuffixFromUrlParamKey(key), facetNames)
                attrs[displayName] = value
            }
        })
        setSelectedAtributos(attrs)
    }, [searchParams, atributosData])

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        if (params.get(key) === value) params.delete(key)
        else params.set(key, value)
        // Cambiar 'rubro' a 'tipo' en los params
        if (key === 'rubro') {
            params.set('tipo', value)
            params.delete('rubro')
        }
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
        if (isOpenMobile) setIsOpenMobile(false)
    }

    const handleRemoveFilter = (key: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '')

        // Si es un atributo, eliminar solo ese atributo
        if (key.startsWith('attr_')) {
            const displayName = findAttrDisplayName(attrSuffixFromUrlParamKey(key), Object.keys(atributosData))
            deleteAttrParamsForDisplayName(params, displayName)
            setSelectedAtributos(prev => {
                const newAttrs = { ...prev }
                delete newAttrs[displayName]
                return newAttrs
            })
            params.set('page', '1')
            router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
            return
        }

        // Buscador por moto (URL): misma cascada que en CatalogHeader
        if (key === 'fabricante') {
            ;['fabricante', 'modelo', 'cilindrada', 'version', 'anio', 'ano'].forEach(k =>
                params.delete(k)
            )
            params.set('page', '1')
            router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
            return
        }
        if (key === 'modelo') {
            ;['modelo', 'cilindrada', 'version', 'anio', 'ano'].forEach(k => params.delete(k))
            params.set('page', '1')
            router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
            return
        }
        if (key === 'cilindrada') {
            ;['cilindrada', 'version', 'anio', 'ano'].forEach(k => params.delete(k))
            params.set('page', '1')
            router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
            return
        }
        if (key === 'version') {
            ;['version', 'anio', 'ano'].forEach(k => params.delete(k))
            params.set('page', '1')
            router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
            return
        }
        if (key === 'anio') {
            params.delete('anio')
            params.delete('ano')
            params.set('page', '1')
            router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
            return
        }

        // Manejar tanto 'tipo' como 'rubro' como la misma cosa
        if (key === 'tipo' || key === 'rubro') {
            params.delete('tipo')
            params.delete('rubro')
            // Limpiar estado local
            setSelectedRubro(null)
            setSelectedSubtipo(null)
        } else {
            params.delete(key)
            if (key === 'marca') {
                setSelectedMarca(null)
            }
            if (key === 'subtipo') {
                setSelectedSubtipo(null)
            }
        }
        // Si se elimina el código, también eliminar tippro y artcod
        if (key === 'codigo') {
            params.delete('tippro')
            params.delete('artcod')
        }
        // Si se elimina tipo/rubro/marca/subtipo, también eliminar todos los atributos
        if (key === 'tipo' || key === 'rubro' || key === 'marca' || key === 'subtipo') {
            const keysToDelete: string[] = []
            params.forEach((_, k) => {
                if (k.startsWith('attr_')) {
                    keysToDelete.push(k)
                }
            })
            keysToDelete.forEach(k => params.delete(k))
            setSelectedAtributos({})
        }
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
        // Clear the search input when removing the filter
        if (key === 'marca') setSearchMarca('')
        if (key === 'tipo' || key === 'rubro') setSearchCategoria('')
        if (key === 'q') {
            // Dispatch custom event to clear search input in Navbar
            window.dispatchEvent(new CustomEvent('clear-search-input'))
            // Clear the search input in the URL - redirect to clean URL
            router.push(pathname || '/catalogo', { scroll: false })
        }
    }

    // Get active filters to display as tags
    const tipproParam = searchParams?.get('tippro')
    const artcodParam = searchParams?.get('artcod')
    const codigoCompleto = tipproParam && artcodParam ? `${tipproParam}${artcodParam}` : null

    // Construir lista de atributos seleccionados
    const atributosActivos = Object.entries(selectedAtributos).map(([displayName, value]) => ({
        key: findAttrUrlParamKeyInSearchParams(displayName, searchParams) ?? attrUrlParamKey(displayName),
        value,
        label: displayName,
    }))

    const chipValSidebar = (name: string, alt?: string) => {
        const raw = searchParams?.get(name) ?? (alt ? searchParams?.get(alt) : null)
        if (raw == null) return null
        const t = raw.trim()
        return t.length > 0 ? t : null
    }

    const activeFilters = [
        { key: 'q', value: chipValSidebar('q'), label: 'Búsqueda' },
        { key: 'codigo', value: codigoCompleto, label: 'Código' },
        { key: 'tipo', value: chipValSidebar('tipo') || chipValSidebar('rubro'), label: 'Categoría' },
        { key: 'marca', value: chipValSidebar('marca'), label: 'Marca' },
        { key: 'subtipo', value: chipValSidebar('subtipo'), label: 'Tipo' },
        { key: 'ofertas', value: isFlagOn('ofertas') ? 'Sí' : null, label: 'Ofertas' },
        { key: 'novedades', value: isFlagOn('novedades') ? 'Sí' : null, label: 'Novedades' },
        { key: 'stockDisponible', value: isFlagOn('stockDisponible') ? 'Sí' : null, label: 'Disponible' },
        { key: 'variacionPrecio', value: isFlagOn('variacionPrecio') ? 'Sí' : null, label: 'Variación de precio' },
        { key: 'stockBue', value: isFlagOn('stockBue') ? 'Sí' : null, label: 'En stock BUE' },
        { key: 'stockCuy', value: isFlagOn('stockCuy') ? 'Sí' : null, label: 'En stock CUYO' },
        { key: 'stockNea', value: isFlagOn('stockNea') ? 'Sí' : null, label: 'En stock NEA' },
        { key: 'stockNoa', value: isFlagOn('stockNoa') ? 'Sí' : null, label: 'En stock NOA' },
        { key: 'fabricante', value: chipValSidebar('fabricante'), label: 'Moto fabricante' },
        { key: 'modelo', value: chipValSidebar('modelo'), label: 'Modelo' },
        { key: 'cilindrada', value: chipValSidebar('cilindrada'), label: 'Cilindrada' },
        { key: 'version', value: chipValSidebar('version'), label: 'Versión' },
        { key: 'anio', value: chipValSidebar('anio') || chipValSidebar('ano'), label: 'Año moto' },
        ...atributosActivos
    ].filter(f => f.value)

    const deleteAttrParams = (params: URLSearchParams) => {
        const keysToDelete: string[] = []
        params.forEach((_, k) => {
            if (k.startsWith('attr_')) keysToDelete.push(k)
        })
        keysToDelete.forEach((k) => params.delete(k))
        setSelectedAtributos({})
    }

    const clearCategoriaFiltro = () => {
        selectRubro(null)
        setSelectedSubtipo(null)
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.delete('tipo')
        params.delete('rubro')
        params.delete('subtipo')
        deleteAttrParams(params)
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
    }

    const clearMarcaFiltro = () => {
        selectMarca(null)
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.delete('marca')
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
    }

    // Manejar selección de categoría (rubro)
    const handleRubroSelect = (rubro: RubroNode) => {
        if (selectedRubro?.label === rubro.label) {
            clearCategoriaFiltro()
            return
        }
        selectRubro(rubro)
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.set('tipo', rubro.label)
        params.delete('rubro')
        if (selectedMarca) {
            params.set('marca', selectedMarca)
        }
        params.delete('subtipo')
        deleteAttrParams(params)
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
    }

    // Manejar selección de subtipo
    const handleSubtipoSelect = (rubro: RubroNode) => {
        if (selectedSubtipo?.label === rubro.label) {
            selectSubtipo(null)
            const params = new URLSearchParams(searchParams?.toString() || '')
            params.delete('subtipo')
            params.set('page', '1')
            router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
            return
        }
        selectSubtipo(rubro)
        const params = new URLSearchParams(searchParams?.toString() || '')
        const parents = tipos.filter((r) =>
            r.children?.some((s) => s.label === rubro.label || s.id === rubro.id)
        )
        if (parents.length === 1) {
            params.set('tipo', parents[0].label)
            setSelectedRubro(parents[0])
        } else if (selectedRubro && parents.some((p) => p.label === selectedRubro.label)) {
            params.set('tipo', selectedRubro.label)
        } else {
            params.delete('tipo')
            setSelectedRubro(null)
        }
        params.delete('rubro')
        params.set('subtipo', rubro.label)
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
    }

    // Marca: no clava tipo/subtipo; el listado se acota a los que la contienen
    const handleMarcaSelect = (marca: string) => {
        if (selectedMarca === marca) {
            selectMarca(null)
            const params = new URLSearchParams(searchParams?.toString() || '')
            params.delete('marca')
            params.set('page', '1')
            router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
            return
        }
        selectMarca(marca)
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.set('marca', marca)
        params.set('page', '1')
        router.push(`${pathname}?${appendNrocta(params).toString()}`, { scroll: false })
    }

    return (
        <>
            {/* Botón Flotante para Mobile */}
            <button
                onClick={() => setIsOpenMobile(true)}
                className="lg:hidden fixed bottom-6 right-6 z-50 bg-[#0e8c85] text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold"
            >
                <Menu size={20} /> FILTROS
            </button>

            {/* Sidebar Container: columna flex a alto viewport; un solo scroll interno */}
            <aside className={`
                fixed inset-y-0 left-0 z-[60] flex w-[280px] flex-col bg-[#001f3f] text-white transition-transform duration-300 transform
                lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100dvh-4rem)] lg:max-h-[calc(100dvh-4rem)] lg:w-[240px] lg:translate-x-0 lg:self-start
                ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Header Sidebar */}
                <div className="flex shrink-0 items-center justify-between border-b border-blue-900/50 p-4">
                    <h2 className="text-[18px] font-black tracking-tighter italic">FILTROS</h2>
                    <div className="flex items-center gap-4">
                        {activeFilters.length > 0 && (
                            <button
                                onClick={() => {
                                    if (pathname) {
                                        const params = new URLSearchParams()
                                        router.push(`${pathname}?${appendNrocta(params).toString()}`)
                                    }
                                    setSearchMarca('')
                                    setSearchCategoria('')
                                    resetCascadeFilters()
                                    setSelectedAtributos({})
                                }}
                                className="text-[10px] text-blue-400 font-bold hover:text-white uppercase"
                            >
                                Limpiar
                            </button>
                        )}
                        <button onClick={() => setIsOpenMobile(false)} className="lg:hidden">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {activeFilters.length > 0 && (
                    <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-blue-900/40 px-3 py-2">
                        {activeFilters.map(f => (
                            <button
                                key={`${f.key}-${String(f.value)}`}
                                type="button"
                                onClick={() => handleRemoveFilter(f.key)}
                                className="inline-flex items-center gap-1 rounded-full bg-[#002d5a] px-2 py-0.5 text-[10px] font-semibold text-blue-100 hover:bg-[#0e8c85]"
                            >
                                <span>
                                    {f.label}: {f.value}
                                </span>
                                <X className="w-3 h-3 shrink-0" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar pb-20 lg:pb-4">

                    {/* ESTADO — radios exclusivos (legacy sidebar / screenshot) */}
                    <FilterSection title="ESTADO" isOpen={true}>
                        <FlagRadio
                            label="Ofertas"
                            checked={isFlagOn('ofertas')}
                            onChange={() => selectExclusiveFlag('ofertas', ESTADO_FLAGS)}
                            title="Mostrar productos actualmente en oferta"
                            emphasize
                        />
                        <FlagRadio
                            label="Novedades"
                            checked={isFlagOn('novedades')}
                            onChange={() => selectExclusiveFlag('novedades', ESTADO_FLAGS)}
                        />
                        {isLoggedIn && (
                            <>
                                <FlagRadio
                                    label="Variación de precio"
                                    checked={isFlagOn('variacionPrecio')}
                                    onChange={() => selectExclusiveFlag('variacionPrecio', ESTADO_FLAGS)}
                                    title="Productos con variación de precios en los últimos 30 días"
                                />
                                {STOCK_BRANCHES.map((branch) => (
                                    <FlagCheckbox
                                        key={branch.key}
                                        label={branch.label}
                                        checked={isFlagOn(branch.key)}
                                        onChange={() => toggleStockBranch(branch.key)}
                                    />
                                ))}
                            </>
                        )}
                    </FilterSection>

                    {/* Sección DINÁMICA: MARCAS con Buscador Real */}
                    <FilterSection
                        title={"MARCAS"}
                        badge={marcasFiltradas.length.toString()}
                        isOpen={true}
                    >
                        {selectedMarca && (
                            <button
                                type="button"
                                onClick={clearMarcaFiltro}
                                className="text-[10px] text-blue-400 hover:text-white mb-2 underline"
                            >
                                ← Ver todas las marcas
                            </button>
                        )}
                        <div className="relative mb-3 px-1">
                            <input
                                type="text"
                                placeholder="Buscar Marcas"
                                value={searchMarca}
                                onChange={(e) => setSearchMarca(e.target.value)}
                                className="w-full bg-[#002d5a] border-none rounded-md py-1.5 pl-8 pr-2 text-[12px] placeholder:text-blue-300 focus:ring-1 focus:ring-blue-400 outline-none"
                            />
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-blue-300" />
                        </div>
                        <div className="pr-2">
                            {marcasFiltradas.map(m => (
                                <FilterOption
                                    key={m.label}
                                    label={m.label}
                                    active={searchParams?.get('marca') === m.label}
                                    onClick={() => handleMarcaSelect(m.label)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Sección DINÁMICA: RUBROS (Categorías) */}
                    <FilterSection title="CATEGORÍAS" badge={rubrosFiltrados.length.toString()} isOpen={true}>
                        {selectedRubro && (
                            <button
                                type="button"
                                onClick={clearCategoriaFiltro}
                                className="text-[10px] text-blue-400 hover:text-white mb-2 underline"
                            >
                                ← Ver todas las categorías
                            </button>
                        )}
                        <div className="relative mb-3 px-1">
                            <input
                                type="text"
                                placeholder="Buscar Categorías"
                                value={searchCategoria}
                                onChange={(e) => setSearchCategoria(e.target.value)}
                                className="w-full bg-[#002d5a] border-none rounded-md py-1.5 pl-8 pr-2 text-[12px] placeholder:text-blue-300 focus:ring-1 focus:ring-blue-400 outline-none"
                            />
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-blue-300" />
                        </div>
                        <div className="pr-2">
                            {rubrosFiltrados.map(r => (
                                <FilterOption
                                    key={r.label}
                                    label={r.label}
                                    active={searchParams?.get('tipo') === r.label || searchParams?.get('rubro') === r.label}
                                    onClick={() => handleRubroSelect(r)}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Sección DINÁMICA: TIPOS DE PRODUCTO */}
                    <FilterSection
                        title={"SUB CATEGORIAS / TIPOS"}
                        badge={subtiposFiltrados.length.toString()}
                        defaultOpen={!!selectedRubro}
                    >
                        {selectedRubro && (
                            <button
                                onClick={() => {
                                    setSelectedRubro(null)
                                    setSelectedSubtipo(null)
                                }}
                                className="text-[10px] text-blue-400 hover:text-white mb-2 underline"
                            >
                                ← Ver todos los tipos
                            </button>
                        )}
                        <div className="relative mb-3 px-1">
                            <input
                                type="text"
                                placeholder="Buscar Tipos"
                                value={searchSubtipo}
                                onChange={(e) => setSearchSubtipo(e.target.value)}
                                className="w-full bg-[#002d5a] border-none rounded-md py-1.5 pl-8 pr-2 text-[12px] placeholder:text-blue-300 focus:ring-1 focus:ring-blue-400 outline-none"
                            />
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-blue-300" />
                        </div>
                        <div className="pr-2">
                            {subtiposFiltrados.sort((a, b) => a.label.localeCompare(b.label)).map(s => (
                                <FilterOption
                                    key={s.label}
                                    label={s.label}
                                    active={searchParams?.get('subtipo') === s.label}
                                    onClick={() => handleSubtipoSelect(s)}
                                />
                            ))}
                        </div>
                    </FilterSection>



                    {/* Sección ATRIBUTOS (Dinámico) */}
                    {/* facetas attr_* (misma URL que usa CatalogHeader para acotar aplicaciones/moto) */}
                    <FilterSection title="ATRIBUTOS" isOpen={true}>
                        {loadingAtributos ? (
                            <p className="text-[10px] text-blue-300 font-bold mb-2 ml-1">Cargando...</p>
                        ) : Object.keys(atributosData).length > 0 ? (
                            Object.entries(atributosData).map(([attrName, valores]) => (
                                <div key={attrName} className="mb-3">
                                    <p className="text-[10px] text-blue-300 font-bold mb-1 ml-1 uppercase">{attrName}</p>
                                    <div className="pr-2">
                                        {valores.slice(0, 100).map((valor) => (
                                            <FilterOption
                                                key={valor}
                                                label={valor}
                                                active={isAttrParamSelected(attrName, valor, searchParams)}
                                                onClick={() => handleAtributoSelect(attrName, valor)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-blue-300 font-bold mb-2 ml-1 italic">
                                Seleccione una categoría para ver atributos
                            </p>
                        )}
                    </FilterSection>
                </div>
            </aside>

            {/* Overlay para cerrar en mobile al hacer click fuera */}
            {isOpenMobile && (
                <div
                    className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
                    onClick={() => setIsOpenMobile(false)}
                />
            )}
        </>
    )
}

function FilterSection({ title, children, badge, isOpen: initialOpen = false, defaultOpen = false }: { title: string, children: React.ReactNode, badge?: string, isOpen?: boolean, defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen || initialOpen)
    return (
        <div className="px-4 py-4 border-b border-blue-900/30">
            <div
                onClick={() => setOpen(!open)}
                className="flex justify-between items-center mb-3 group cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-black tracking-widest text-white uppercase">{title}</h3>
                    {badge && (
                        <span className="bg-[#0e8c85] text-white text-[9px] font-bold px-1.5 min-w-[18px] h-4 flex items-center justify-center rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                {open ? <ChevronUp size={14} className="text-blue-400" /> : <ChevronDown size={14} className="text-blue-400" />}
            </div>
            {open && <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">{children}</div>}
        </div>
    )
}

function FilterOption({ label, active = false, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between group cursor-pointer py-0.5"
        >
            <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all
                    ${active ? 'border-[#0e8c85]' : 'border-blue-700'}`}>
                    {active && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />}
                </div>
                <span className={`text-[11px] font-bold uppercase transition-colors
                    ${active ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
                    {label}
                </span>
            </div>
        </div>
    )
}

function FlagRadio({
    label,
    checked,
    onChange,
    title,
    emphasize = false,
}: {
    name?: string
    label: string
    checked: boolean
    onChange: () => void
    title?: string
    emphasize?: boolean
}) {
    return (
        <div
            role="radio"
            aria-checked={checked}
            tabIndex={0}
            title={title}
            onClick={onChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange()
                }
            }}
            className="flex items-center justify-between group cursor-pointer py-0.5"
        >
            <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all
                    ${checked ? 'border-[#0e8c85]' : 'border-blue-700'}`}>
                    {checked && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />}
                </div>
                <span className={`uppercase transition-colors
                    ${emphasize ? 'text-[12px] font-black' : 'text-[11px] font-bold'}
                    ${checked ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
                    {label}
                </span>
            </div>
        </div>
    )
}

function FlagCheckbox({
    label,
    checked,
    onChange,
    title,
}: {
    label: string
    checked: boolean
    onChange: () => void
    title?: string
}) {
    return (
        <div
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            title={title}
            onClick={onChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange()
                }
            }}
            className="flex items-center justify-between group cursor-pointer py-0.5"
        >
            <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all
                    ${checked ? 'border-[#0e8c85] bg-[#0e8c85]' : 'border-blue-700 bg-transparent'}`}>
                    {checked && (
                        <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M1.5 5.5 4 8l4.5-6" />
                        </svg>
                    )}
                </div>
                <span className={`text-[11px] font-bold uppercase transition-colors
                    ${checked ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
                    {label}
                </span>
            </div>
        </div>
    )
}
