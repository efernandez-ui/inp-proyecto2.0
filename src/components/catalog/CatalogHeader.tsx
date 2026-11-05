'use client'

import { Search, Trash2, Download, Calculator, X, AlertTriangle, LayoutGrid, Table2 } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useCatalogUI } from '@/context/CatalogUIContext'
import { useCurrency } from '@/hooks/useCurrencyPreference'
import Modal from '@/components/modals/Modal'
import DescargarPreciosModal from '@/components/catalog/DescargarPreciosModal'
import { addCatalogScopeToSearchParams } from '@/utils/catalogScopeParams'
import { attrSuffixFromUrlParamKey, deleteAttrParamsForDisplayName } from '@/utils/attrFilterParams'
import { isStaff } from '@/utils/auth'
import { toast } from 'react-toastify'
import { useIsCatalogDesktop } from '@/hooks/useMediaQuery'

interface FiltrosAplicaciones {
    fabricantes: string[]
    modelos: string[]
    cilindradas: string[]
    versiones: string[]
    aniosDesde: number[]
    aniosHasta: number[]
    anios: string[]
}

interface CatalogHeaderProps {
    totalProducts: number
    currentPage: number
    pageSize: number
}

// URL base del backend (cliente: solo NEXT_PUBLIC_* está garantizado en el navegador)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BACKEND || ''

export default function CatalogHeader({ totalProducts, currentPage, pageSize }: CatalogHeaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isLoggedIn, user, selectedClient } = useSelector((state: RootState) => state.auth)

    // Convertir searchParams a objeto seguro (puede ser null en algunos casos)
    const params = searchParams || new URLSearchParams()

    const {
        showPurchasePrice: contextShowPurchasePrice,
        showPublicPrice: contextShowPublicPrice,
        markupPercentage,
        viewMode,
        setViewMode,
        togglePurchasePrice: contextTogglePurchasePrice,
        togglePublicPrice: contextTogglePublicPrice,
        setMarkupPercentage
    } = useCatalogUI()
    const isCatalogDesktop = useIsCatalogDesktop()

    // Estado local para los checkboxes - inicializado desde el contexto
    const [showPurchasePrice, setShowPurchasePrice] = useState(contextShowPurchasePrice)
    const [showPublicPrice, setShowPublicPrice] = useState(contextShowPublicPrice)

    // Estado para el popup de advertencia de markup
    const [showMarkupWarning, setShowMarkupWarning] = useState(false)
    const [showDescargarPrecios, setShowDescargarPrecios] = useState(false)

    // Sincronizar estados locales con el contexto cuando cambian
    useEffect(() => {
        setShowPurchasePrice(contextShowPurchasePrice)
    }, [contextShowPurchasePrice])

    useEffect(() => {
        setShowPublicPrice(contextShowPublicPrice)
    }, [contextShowPublicPrice])

    // Usar el hook de preferencia de moneda con persistencia
    const { currency, setCurrency } = useCurrency()

    // Estado local para los filtros de moto
    const [filters, setFilters] = useState({
        fabricante: '',
        modelo: '',
        cilindrada: '',
        version: '',
        anio: '',
    })

    // Estado para ordenamiento - inicializar con valores por defecto
    const [sortBy, setSortBy] = useState('relevancia')
    const [sortOrder, setSortOrder] = useState('asc')

    // Función para manejar toggle de Precio Compra
    const handleTogglePurchasePrice = useCallback(() => {
        const newValue = !showPurchasePrice
        setShowPurchasePrice(newValue)
        // Sincronizar con el contexto
        if (newValue !== contextShowPurchasePrice) {
            contextTogglePurchasePrice()
        }
    }, [showPurchasePrice, contextShowPurchasePrice, contextTogglePurchasePrice])

    // Función para manejar toggle de Precio Público
    const handleTogglePublicPrice = useCallback(() => {
        // Si se va a activar y no hay markup, mostrar warning
        if (!showPublicPrice && markupPercentage <= 0) {
            setShowMarkupWarning(true)
        } else {
            const newValue = !showPublicPrice
            setShowPublicPrice(newValue)
            // Sincronizar con el contexto
            if (newValue !== contextShowPublicPrice) {
                contextTogglePublicPrice()
            }
        }
    }, [showPublicPrice, markupPercentage, contextShowPublicPrice, contextTogglePublicPrice])

    // Confirmar activar precio público
    const confirmPublicPrice = useCallback(() => {
        setShowPublicPrice(true)
        setShowMarkupWarning(false)
        // Sincronizar con el contexto
        if (contextShowPublicPrice !== true) {
            contextTogglePublicPrice()
        }
    }, [contextShowPublicPrice, contextTogglePublicPrice])

    // Cancelar y mantener precio público desactivado
    const cancelPublicPrice = useCallback(() => {
        setShowMarkupWarning(false)
    }, [])
    const [filtrosAplicaciones, setFiltrosAplicaciones] = useState<FiltrosAplicaciones>({
        fabricantes: [],
        modelos: [],
        cilindradas: [],
        versiones: [],
        aniosDesde: [],
        aniosHasta: [],
        anios: []
    })

    const [loadingFiltros, setLoadingFiltros] = useState(true)

    // Obtener pathname para usar en las funciones
    const pathname = usePathname()

    // Sincronizar orden y buscador moto con la URL (valores ausentes en URL limpian estado local)
    useEffect(() => {
        const urlSortBy = params.get('sortBy')
        const urlSortOrder = params.get('sortOrder')
        if (urlSortBy) setSortBy(urlSortBy)
        if (urlSortOrder) setSortOrder(urlSortOrder)

        setFilters({
            fabricante: params.get('fabricante') ?? '',
            modelo: params.get('modelo') ?? '',
            cilindrada: params.get('cilindrada') ?? '',
            version: params.get('version') ?? '',
            anio: params.get('anio') ?? params.get('ano') ?? '',
        })
    }, [params.toString()])

    // Cargar listas de aplicaciones (fabricantes, etc.) acotadas por filtros de catálogo en la URL
    useEffect(() => {
        const cargarFiltros = async () => {
            setLoadingFiltros(true)
            try {
                const scopeParams = new URLSearchParams()
                addCatalogScopeToSearchParams(scopeParams, searchParams)
                const qs = scopeParams.toString()
                const url = qs
                    ? `${API_BASE_URL}/api/public/productos/filtros-aplicaciones?${qs}`
                    : `${API_BASE_URL}/api/public/productos/filtros-aplicaciones`
                const response = await fetch(url)
                if (response.ok) {
                    const data = await response.json()
                    // Solo fabricantes (y rangos de año del índice) desde el agregado global.
                    // Modelos/cilindradas/versiones los rellenan los endpoints acotados por fabricante/modelo
                    // para no pisar listas filtradas con el dump completo del catálogo.
                    setFiltrosAplicaciones(prev => ({
                        ...prev,
                        fabricantes: data.fabricantes || [],
                        aniosDesde: data.aniosDesde || [],
                        aniosHasta: data.aniosHasta || [],
                    }))
                }
            } catch (error) {
                console.error('Error cargando filtros:', error)
            } finally {
                setLoadingFiltros(false)
            }
        }
        cargarFiltros()
    }, [searchParams])

    // Cargar modelos cuando cambia el fabricante (acotados al catálogo seleccionado en la URL)
    useEffect(() => {
        if (filters.fabricante) {
            const cargarModelos = async () => {
                try {
                    const p = new URLSearchParams()
                    p.set('fabricante', filters.fabricante)
                    addCatalogScopeToSearchParams(p, searchParams)
                    const response = await fetch(
                        `${API_BASE_URL}/api/public/productos/modelos-by-fabricante?${p.toString()}`
                    )
                    if (response.ok) {
                        const modelos = await response.json()
                        setFiltrosAplicaciones(prev => ({
                            ...prev,
                            modelos: modelos
                        }))
                    }
                } catch (error) {
                    console.error('Error cargando modelos:', error)
                }
            }
            cargarModelos()
        } else {
            setFiltrosAplicaciones(prev => ({
                ...prev,
                modelos: []
            }))
        }
    }, [filters.fabricante, searchParams])

    // Cargar cilindradas cuando hay fabricante y modelo (misma lógica que el backend por niveles)
    useEffect(() => {
        if (filters.fabricante && filters.modelo) {
            const cargarCilindradas = async () => {
                try {
                    const urlParams = new URLSearchParams()
                    if (filters.fabricante) urlParams.set('fabricante', filters.fabricante)
                    if (filters.modelo) urlParams.set('modelo', filters.modelo)
                    addCatalogScopeToSearchParams(urlParams, searchParams)

                    const response = await fetch(
                        `${API_BASE_URL}/api/public/productos/cilindradas-by-filtros?${urlParams.toString()}`
                    )
                    if (response.ok) {
                        const cilindradas = await response.json()
                        setFiltrosAplicaciones(prev => ({
                            ...prev,
                            cilindradas: cilindradas
                        }))
                    }
                } catch (error) {
                    console.error('Error cargando cilindradas:', error)
                }
            }
            cargarCilindradas()
        } else {
            setFiltrosAplicaciones(prev => ({
                ...prev,
                cilindradas: []
            }))
        }
    }, [filters.fabricante, filters.modelo, searchParams])

    // Cargar versiones cuando cambia cilindrada
    useEffect(() => {
        if (filters.fabricante || filters.modelo || filters.cilindrada) {
            const cargarVersiones = async () => {
                try {
                    const urlParams = new URLSearchParams()
                    if (filters.fabricante) urlParams.set('fabricante', filters.fabricante)
                    if (filters.modelo) urlParams.set('modelo', filters.modelo)
                    if (filters.cilindrada) urlParams.set('cilindrada', filters.cilindrada)
                    addCatalogScopeToSearchParams(urlParams, searchParams)

                    const response = await fetch(
                        `${API_BASE_URL}/api/public/productos/versiones-by-filtros?${urlParams.toString()}`
                    )
                    if (response.ok) {
                        const versiones = await response.json()
                        setFiltrosAplicaciones(prev => ({
                            ...prev,
                            versiones: versiones
                        }))
                    }
                } catch (error) {
                    console.error('Error cargando versiones:', error)
                }
            }
            cargarVersiones()
        } else {
            setFiltrosAplicaciones(prev => ({
                ...prev,
                versiones: []
            }))
        }
    }, [filters.fabricante, filters.modelo, filters.cilindrada, searchParams])

    // Cargar años cuando cambia cilindrada o version
    useEffect(() => {
        if (filters.fabricante || filters.modelo || filters.cilindrada || filters.version) {
            const cargarAnios = async () => {
                try {
                    const urlParams = new URLSearchParams()
                    if (filters.fabricante) urlParams.set('fabricante', filters.fabricante)
                    if (filters.modelo) urlParams.set('modelo', filters.modelo)
                    if (filters.version) urlParams.set('version', filters.version)
                    if (filters.cilindrada) urlParams.set('cilindrada', filters.cilindrada)
                    addCatalogScopeToSearchParams(urlParams, searchParams)

                    const response = await fetch(
                        `${API_BASE_URL}/api/public/productos/anios-by-filtros?${urlParams.toString()}`
                    )
                    if (response.ok) {
                        const anios = await response.json()
                        setFiltrosAplicaciones(prev => ({
                            ...prev,
                            anios: anios
                        }))
                    }
                } catch (error) {
                    console.error('Error cargando años:', error)
                }
            }
            cargarAnios()
        } else {
            setFiltrosAplicaciones(prev => ({
                ...prev,
                anios: []
            }))
        }
    }, [filters.fabricante, filters.modelo, filters.cilindrada, filters.version, searchParams])

    // Actualizar filtros y URL
    const updateFilter = useCallback((key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))

        const newParams = new URLSearchParams(params.toString())
        if (value) {
            newParams.set(key, value)
        } else {
            newParams.delete(key)
        }

        // Limpiar filtros dependientes del buscador de motos
        if (key === 'fabricante') {
            newParams.delete('modelo')
            newParams.delete('cilindrada')
            newParams.delete('version')
            newParams.delete('anio')
            newParams.delete('ano')
            // Mantener otros filtros y mover a página 1
            newParams.set('page', '1')
        } else if (key === 'modelo') {
            newParams.delete('cilindrada')
            newParams.delete('version')
            newParams.delete('anio')
            newParams.delete('ano')
            newParams.set('page', '1')
        } else if (key === 'cilindrada') {
            newParams.delete('version')
            newParams.delete('anio')
            newParams.delete('ano')
            newParams.set('page', '1')
        } else if (key === 'version') {
            newParams.delete('anio')
            newParams.delete('ano')
            newParams.set('page', '1')
        } else if (key === 'anio') {
            newParams.delete('ano')
            newParams.set('page', '1')
        }

        router.push(`${pathname || '/catalogo'}?${newParams.toString()}`, { scroll: false })
    }, [params, pathname, router])

    // Actualizar ordenamiento
    const updateSort = useCallback((sortByValue: string) => {
        setSortBy(sortByValue)

        // Determinar order según sortBy
        let sortOrderValue = 'asc'
        if (sortByValue.includes('_desc') ||
            sortByValue === 'precio_desc' ||
            sortByValue === 'nombre_desc') {
            sortOrderValue = 'desc'
        }

        setSortOrder(sortOrderValue)

        const newParams = new URLSearchParams(params.toString())
        if (sortByValue && sortByValue !== 'relevancia') {
            newParams.set('sortBy', sortByValue)
            newParams.set('sortOrder', sortOrderValue)
        } else {
            newParams.delete('sortBy')
            newParams.delete('sortOrder')
        }
        router.push(`${pathname || '/catalogo'}?${newParams.toString()}`, { scroll: false })
    }, [params, pathname, router])

    // Actualizar moneda - usar setCurrency directamente para evitar problemas de sincronización
    const handleCurrencyChange = useCallback((currencyValue: 'ARS' | 'USD') => {
        setCurrency(currencyValue)
    }, [setCurrency])

    // Quitar solo los parámetros del buscador por moto (conserva categoría/marca/etc.)
    const clearMotoFilters = useCallback(() => {
        setFilters({
            fabricante: '',
            modelo: '',
            cilindrada: '',
            version: '',
            anio: '',
        })
        const newParams = new URLSearchParams(params.toString())
        ;['fabricante', 'modelo', 'cilindrada', 'version', 'anio', 'ano'].forEach(k => newParams.delete(k))
        newParams.set('page', '1')
        router.push(`${pathname || '/catalogo'}?${newParams.toString()}`, { scroll: false })
    }, [params, pathname, router])

    // Calcular rango de productos mostrados
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalProducts)

    const chipVal = (name: string, alt?: string) => {
        const raw = params.get(name) ?? (alt ? params.get(alt) : null)
        if (raw == null) return null
        const t = raw.trim()
        return t.length > 0 ? t : null
    }

    const isFlagOn = (key: string) => params.get(key) === 'true'

    const tipproParam = chipVal('tippro')
    const artcodParam = chipVal('artcod')
    const codigoCompleto = tipproParam && artcodParam ? `${tipproParam}${artcodParam}` : null

    const atributosActivos: { key: string; value: string; label: string }[] = []
    params.forEach((value, key) => {
        if (!key.startsWith('attr_') || !value?.trim()) return
        const suffix = attrSuffixFromUrlParamKey(key)
        atributosActivos.push({
            key,
            value: value.trim(),
            label: suffix.replace(/_/g, ' '),
        })
    })

    // Chips: mismos filtros que SidebarFilters (búsqueda, flags, moto, atributos)
    const activeFilters = [
        { key: 'q', value: chipVal('q'), label: 'Búsqueda' },
        { key: 'codigo', value: codigoCompleto, label: 'Código' },
        { key: 'tipo', value: chipVal('tipo') || chipVal('rubro'), label: 'Categoría' },
        { key: 'marca', value: chipVal('marca'), label: 'Marca' },
        { key: 'subtipo', value: chipVal('subtipo'), label: 'Tipo' },
        { key: 'ofertas', value: isFlagOn('ofertas') ? 'Sí' : null, label: 'Ofertas' },
        { key: 'novedades', value: isFlagOn('novedades') ? 'Sí' : null, label: 'Novedades' },
        { key: 'stockDisponible', value: isFlagOn('stockDisponible') ? 'Sí' : null, label: 'Disponible' },
        { key: 'variacionPrecio', value: isFlagOn('variacionPrecio') ? 'Sí' : null, label: 'Variación de precio' },
        { key: 'stockBue', value: isFlagOn('stockBue') ? 'Sí' : null, label: 'En stock BUE' },
        { key: 'stockCuy', value: isFlagOn('stockCuy') ? 'Sí' : null, label: 'En stock CUYO' },
        { key: 'stockNea', value: isFlagOn('stockNea') ? 'Sí' : null, label: 'En stock NEA' },
        { key: 'stockNoa', value: isFlagOn('stockNoa') ? 'Sí' : null, label: 'En stock NOA' },
        { key: 'fabricante', value: chipVal('fabricante'), label: 'Moto fabricante' },
        { key: 'modelo', value: chipVal('modelo'), label: 'Modelo' },
        { key: 'cilindrada', value: chipVal('cilindrada'), label: 'Cilindrada' },
        { key: 'version', value: chipVal('version'), label: 'Versión' },
        { key: 'anio', value: chipVal('anio') || chipVal('ano'), label: 'Año moto' },
        ...atributosActivos,
    ].filter(f => f.value)

    const appendNrocta = useCallback((target: URLSearchParams) => {
        if (isStaff(user) && selectedClient?.nrocta && !target.has('nrocta')) {
            target.set('nrocta', selectedClient.nrocta)
        }
        return target
    }, [user, selectedClient])

    const handleRemoveFilter = useCallback((key: string) => {
        const newParams = new URLSearchParams(params.toString())

        const deleteAllAttrParams = () => {
            const attrKeys: string[] = []
            newParams.forEach((_, k) => {
                if (k.startsWith('attr_')) attrKeys.push(k)
            })
            attrKeys.forEach(k => newParams.delete(k))
        }

        if (key.startsWith('attr_')) {
            const displayName = attrSuffixFromUrlParamKey(key).replace(/_/g, ' ')
            deleteAttrParamsForDisplayName(newParams, displayName)
            newParams.delete(key)
        } else if (key === 'fabricante') {
            ;['fabricante', 'modelo', 'cilindrada', 'version', 'anio', 'ano'].forEach(k => newParams.delete(k))
        } else if (key === 'modelo') {
            ;['modelo', 'cilindrada', 'version', 'anio', 'ano'].forEach(k => newParams.delete(k))
        } else if (key === 'cilindrada') {
            ;['cilindrada', 'version', 'anio', 'ano'].forEach(k => newParams.delete(k))
        } else if (key === 'version') {
            ;['version', 'anio', 'ano'].forEach(k => newParams.delete(k))
        } else if (key === 'anio') {
            newParams.delete('anio')
            newParams.delete('ano')
        } else if (key === 'tipo' || key === 'rubro') {
            newParams.delete('tipo')
            newParams.delete('rubro')
            newParams.delete('subtipo')
            deleteAllAttrParams()
        } else if (key === 'marca' || key === 'subtipo') {
            newParams.delete(key)
            deleteAllAttrParams()
        } else if (key === 'codigo') {
            newParams.delete('codigo')
            newParams.delete('tippro')
            newParams.delete('artcod')
        } else if (key === 'q') {
            newParams.delete('q')
            window.dispatchEvent(new CustomEvent('clear-search-input'))
        } else {
            newParams.delete(key)
        }

        newParams.set('page', '1')
        router.push(`${pathname || '/catalogo'}?${appendNrocta(newParams).toString()}`, { scroll: false })
    }, [params, pathname, router, appendNrocta])

    const clearAllFilters = useCallback(() => {
        const next = new URLSearchParams()
        appendNrocta(next)
        router.push(
            next.toString() ? `${pathname || '/catalogo'}?${next.toString()}` : (pathname || '/catalogo'),
            { scroll: false },
        )
        window.dispatchEvent(new CustomEvent('clear-search-input'))
    }, [appendNrocta, pathname, router])

    return (
        <div className="w-full">
            {/* ===== FRANJA SUPERIOR: BUSCADOR DE MOTOS ===== */}
            <div className="bg-[#001f3f] text-white px-4 py-3">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6">
                        <h2 className="shrink-0 whitespace-nowrap text-sm font-bold tracking-wide">BUSCADOR POR MOTO</h2>
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        {/* Select Fabricante */}
                        <select
                            value={filters.fabricante}
                            onChange={(e) => updateFilter('fabricante', e.target.value)}
                            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:border-white/40 w-32 [&>option]:bg-slate-800 [&>option]:text-white"
                        >
                            <option value="" className="bg-slate-800 text-white">Fabricante</option>
                            {loadingFiltros ? (
                                <option disabled className="bg-slate-800 text-gray-400">Cargando...</option>
                            ) : (
                                <>
                                    {filters.fabricante &&
                                        !filtrosAplicaciones.fabricantes.includes(filters.fabricante) && (
                                        <option value={filters.fabricante} className="bg-slate-800 text-white">
                                            {filters.fabricante}
                                        </option>
                                    )}
                                    {filtrosAplicaciones.fabricantes.map(fab => (
                                        <option key={fab} value={fab} className="bg-slate-800 text-white">{fab}</option>
                                    ))}
                                </>
                            )}
                        </select>

                        {/* Select Modelo */}
                        <select
                            value={filters.modelo}
                            onChange={(e) => updateFilter('modelo', e.target.value)}
                            disabled={!filters.fabricante || loadingFiltros}
                            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:border-white/40 w-32 disabled:opacity-50 [&>option]:bg-slate-800 [&>option]:text-white"
                        >
                            <option value="" className="bg-slate-800 text-white">Modelo</option>
                            {filters.modelo &&
                                !filtrosAplicaciones.modelos.includes(filters.modelo) && (
                                <option value={filters.modelo} className="bg-slate-800 text-white">
                                    {filters.modelo}
                                </option>
                            )}
                            {filtrosAplicaciones.modelos.map(mod => (
                                <option key={mod} value={mod} className="bg-slate-800 text-white">{mod}</option>
                            ))}
                        </select>

                        {/* Select Cilindrada */}
                        <select
                            value={filters.cilindrada}
                            onChange={(e) => updateFilter('cilindrada', e.target.value)}
                            disabled={!filters.modelo}
                            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:border-white/40 w-28 disabled:opacity-50 [&>option]:bg-slate-800 [&>option]:text-white"
                        >
                            <option value="" className="bg-slate-800 text-white">Cilindrada</option>
                            {filters.cilindrada &&
                                !filtrosAplicaciones.cilindradas.includes(filters.cilindrada) && (
                                <option value={filters.cilindrada} className="bg-slate-800 text-white">
                                    {filters.cilindrada}
                                </option>
                            )}
                            {filtrosAplicaciones.cilindradas.map(cil => (
                                <option key={cil} value={cil} className="bg-slate-800 text-white">{cil}</option>
                            ))}
                        </select>

                        {/* Select Versión */}
                        <select
                            value={filters.version}
                            onChange={(e) => updateFilter('version', e.target.value)}
                            disabled={!filters.cilindrada}
                            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:border-white/40 w-36 disabled:opacity-50 [&>option]:bg-slate-800 [&>option]:text-white"
                        >
                            <option value="" className="bg-slate-800 text-white">Versión</option>
                            {filters.version &&
                                !filtrosAplicaciones.versiones.includes(filters.version) &&
                                filters.version !== '-' && (
                                <option value={filters.version} className="bg-slate-800 text-white">
                                    {filters.version}
                                </option>
                            )}
                            {filtrosAplicaciones.versiones.map(ver => (
                                <option key={ver} value={ver === '-' ? '-' : ver} className="bg-slate-800 text-white">{ver === '-' ? 'Todas' : ver}</option>
                            ))}
                        </select>

                        {/* Select Año */}
                        <select
                            value={filters.anio}
                            onChange={(e) => updateFilter('anio', e.target.value)}
                            disabled={!filters.cilindrada}
                            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:border-white/40 w-24 disabled:opacity-50 [&>option]:bg-slate-800 [&>option]:text-white"
                        >
                            <option value="" className="bg-slate-800 text-white">Año</option>
                            {filters.anio &&
                                filtrosAplicaciones.anios &&
                                !filtrosAplicaciones.anios.includes(filters.anio) && (
                                <option value={filters.anio} className="bg-slate-800 text-white">
                                    {filters.anio}
                                </option>
                            )}
                            {/* Usar años del endpoint filtrados por cilindrada */}
                            {filtrosAplicaciones.anios && filtrosAplicaciones.anios.length > 0 ? (
                                filtrosAplicaciones.anios.map(anio => (
                                    <option key={anio} value={anio} className="bg-slate-800 text-white">{anio}</option>
                                ))
                            ) : (
                                <option value="" disabled className="bg-slate-800 text-gray-400">Seleccione cilindrada</option>
                            )}
                        </select>

                        {/* Botón BUSCAR */}
                        <button
                            onClick={() => {/* Trigger search - filters are applied via URL params */ }}
                            className="bg-[#0e8c85] hover:bg-[#0a7068] px-6 py-2 rounded font-bold text-sm flex items-center gap-2 ml-auto transition-colors"
                        >
                            <Search size={16} />
                            BUSCAR
                        </button>

                        {/* Enlace Borrar todo */}
                        <button
                            onClick={clearMotoFilters}
                            className="text-white/70 hover:text-white text-xs flex items-center gap-1 ml-2 transition-colors"
                        >
                            <Trash2 size={12} />
                            Borrar todo
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== FILTROS APLICADOS (debajo del buscador de moto) ===== */}
            {activeFilters.length > 0 && (
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Filtros:</span>
                            {activeFilters.map(f => (
                                <div
                                    key={`${f.key}-${f.value}`}
                                    className="flex items-center gap-1 bg-[#0e8c85] text-white text-xs font-bold px-3 py-1.5 rounded-full"
                                >
                                    <span>{f.label}: {f.value}</span>
                                    <button
                                        onClick={() => handleRemoveFilter(f.key)}
                                        className="ml-1 hover:bg-white/30 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="text-xs text-red-600 hover:text-red-800 font-medium underline ml-2"
                            >
                                Limpiar todos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== FRANJA INFERIOR: BARRA DE HERRAMIENTAS ===== */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Izquierda: Ordenar y paginación */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <select
                                value={sortBy}
                                onChange={(e) => updateSort(e.target.value)}
                                className="
       appearance-none
    border border-gray-300
    rounded-lg
    pl-4 pr-10 py-2
    text-sm
    bg-white
    text-gray-900   <-- CLAVE
    shadow-sm
    focus:outline-none
    focus:ring-2 focus:ring-blue-500
    "
                            >
                                <option value="relevancia">Relevancia</option>
                                <option value="precio_asc">Precio: Menor a Mayor</option>
                                <option value="precio_desc">Precio: Mayor a Menor</option>
                                <option value="nombre_asc">Nombre: A-Z</option>
                                <option value="nombre_desc">Nombre: Z-A</option>
                            </select>

                            {/* Vista Excel solo en desktop (md+); en mobile queda grilla por defecto */}
                            {isCatalogDesktop ? (
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`px-3 py-1.5 rounded transition-colors ${viewMode !== 'spreadsheet' ? 'bg-[#001f3f] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="Vista grilla"
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('spreadsheet')}
                                        className={`px-3 py-1.5 rounded transition-colors ${viewMode === 'spreadsheet' ? 'bg-[#001f3f] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="Vista lista tipo Excel"
                                    >
                                        <Table2 size={16} />
                                    </button>
                                </div>
                            ) : null}
                        </div>


                        {/* Derecha: Herramientas de cotización - Solo para usuarios logueados */}
                        {isLoggedIn && (
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Checkboxes de visibilidad */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showPurchasePrice}
                                        onChange={handleTogglePurchasePrice}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Precio Compra</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showPublicPrice}
                                        onChange={handleTogglePublicPrice}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Precio Público</span>
                                </label>

                                {/* Input de markup */}
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded">
                                    <Calculator size={14} className="text-gray-500" />
                                    <input
                                        type="number"
                                        value={markupPercentage}
                                        onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                                        className="w-12 bg-transparent text-sm font-medium text-gray-900 focus:outline-none text-right"
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                {/* Toggle de moneda */}
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    <button
                                        onClick={() => handleCurrencyChange('ARS')}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${currency === 'ARS'
                                            ? 'bg-[#001f3f] text-white'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        ARS
                                    </button>
                                    <button
                                        onClick={() => handleCurrencyChange('USD')}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${currency === 'USD'
                                            ? 'bg-[#001f3f] text-white'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        USD
                                    </button>
                                </div>

                                {/* Botón descargar */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nrocta = isStaff(user)
                                            ? (selectedClient?.nrocta || '').trim()
                                            : (user?.nrocta || selectedClient?.nrocta || '').trim()
                                        if (!nrocta) {
                                            toast.warning('Por favor seleccione un cliente para descargar un catálogo')
                                            return
                                        }
                                        setShowDescargarPrecios(true)
                                    }}
                                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm font-medium text-gray-700 transition-colors"
                                >
                                    <Download size={16} />
                                    Descargar precios
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Popup de advertencia de markup */}
            <Modal isOpen={showMarkupWarning} onClose={cancelPublicPrice}>
                <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                        Markup no configurado
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                        Para mostrar el precio público, debe ingresar un porcentaje de markup en el campo "% markup".
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-500 text-center">
                            El precio público se calculará aplicando el porcentaje de markup sobre el precio final.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={cancelPublicPrice}
                            className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmPublicPrice}
                            className="flex-1 bg-[#001f3f] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#003366] transition-colors"
                        >
                            Mostrar igual
                        </button>
                    </div>
                </div>
            </Modal>

            <DescargarPreciosModal
                isOpen={showDescargarPrecios}
                onClose={() => setShowDescargarPrecios(false)}
                searchParams={params}
                nrocta={
                    isStaff(user)
                        ? (selectedClient?.nrocta || '').trim()
                        : (user?.nrocta || selectedClient?.nrocta || '').trim()
                }
                clienteNombre={
                    isStaff(user)
                        ? ((selectedClient as any)?.nombre || selectedClient?.nrocta || '')
                        : ((user as any)?.nombre || (selectedClient as any)?.nombre || user?.nrocta || '')
                }
                markupPercentage={markupPercentage}
            />
        </div>
    )
}
