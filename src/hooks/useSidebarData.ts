import { useState, useEffect, useMemo, useRef } from 'react'
import { getRubros, GetRubrosParams } from '@/services/rubros'
import { RubroNode } from '@/interfaces/rubros'

export function useSidebarData(params?: GetRubrosParams, customHeaders?: HeadersInit) {
    const [rubros, setRubros] = useState<RubroNode[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const paramsKey = useMemo(() => {
        if (!params) return ''
        const sortedEntries = Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .sort(([a], [b]) => a.localeCompare(b))
        return JSON.stringify(sortedEntries)
    }, [params])

    const headersRef = useRef(customHeaders)
    useEffect(() => {
        headersRef.current = customHeaders
    }, [customHeaders])

    useEffect(() => {
        let isMounted = true
        setLoading(true)

        getRubros(params, headersRef.current)
            .then(data => {
                if (isMounted) {
                    setRubros(data)
                    setLoading(false)
                    setError(null)
                }
            })
            .catch(err => {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Error al cargar rubros'))
                    setLoading(false)
                }
            })

        return () => {
            isMounted = false
        }
    }, [paramsKey])

    // Ordenamos los rubros y sus hijos alfabéticamente
    // Si está cargando o hay error, retornamos array vacío
    const rubrosOrdenados = useMemo(() => {
        if (!rubros.length) return []

        return rubros.map(rubro => ({
            ...rubro,
            children: rubro.children?.map(subtipo => ({
                ...subtipo,
                children: subtipo.children?.slice().sort((a, b) => a.label.localeCompare(b.label)) || []
            })).sort((a, b) => a.label.localeCompare(b.label)) || []
        })).sort((a, b) => a.label.localeCompare(b.label))
    }, [rubros])

    // Extraemos todas las marcas únicas de todos los rubros para el filtro general
    const todasLasMarcas = useMemo(() => {
        if (!rubrosOrdenados.length) return []

        const map = new Map<string, string>()
        rubrosOrdenados.forEach(r =>
            r.children?.forEach(s =>
                s.children?.forEach(m => map.set(m.label, m.id))
            )
        )
        return Array.from(map.entries())
            .map(([label, id]) => ({ id, label }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [rubrosOrdenados])

    // Extraemos todos los subtipos (Tipos de producto)
    const todosLosSubtipos = useMemo(() => {
        if (!rubrosOrdenados.length) return []

        const map = new Map<string, string>()
        rubrosOrdenados.forEach(r =>
            r.children?.forEach(s => map.set(s.label, s.id))
        )
        return Array.from(map.entries())
            .map(([label, id]) => ({ id, label }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [rubrosOrdenados])

    return {
        tipos: rubrosOrdenados,
        rubros: rubrosOrdenados, // Alias para compatibilidad
        todosLosSubtipos,
        todasLasMarcas,
        loading,
        error
    }
}
