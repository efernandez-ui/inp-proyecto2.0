'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useCurrency } from '@/hooks/useCurrencyPreference'

/** grid = grilla de ProductCard; spreadsheet = vista tipo Excel. (Se eliminó la vista card/detalle.) */
export type CatalogViewMode = 'grid' | 'spreadsheet'

interface CatalogUIState {
    showPurchasePrice: boolean
    showPublicPrice: boolean
    markupPercentage: number
    currency: 'ARS' | 'USD'
    viewMode: CatalogViewMode
}

interface CatalogUIContextType extends CatalogUIState {
    togglePurchasePrice: () => void
    togglePublicPrice: () => void
    setMarkupPercentage: (value: number) => void
    setCurrency: (value: 'ARS' | 'USD') => void
    setViewMode: (value: CatalogViewMode) => void
}

interface CatalogUIPersisted {
    showPurchasePrice?: boolean
    showPublicPrice?: boolean
    markupPercentage?: number
    viewMode?: CatalogViewMode | 'card' | 'detail'
}

const STORAGE_KEY = 'intercap_catalog_ui'

const CatalogUIContext = createContext<CatalogUIContextType | undefined>(undefined)

const DEFAULT_STATE: Omit<CatalogUIState, 'currency'> = {
    showPurchasePrice: true,
    showPublicPrice: true,
    markupPercentage: 0,
    viewMode: 'grid',
}

function normalizeViewMode(value: unknown): CatalogViewMode | null {
    if (value === 'grid') return 'grid'
    if (value === 'spreadsheet') return 'spreadsheet'
    // Preferencias viejas: card/detail → grid
    if (value === 'card' || value === 'detail') return 'grid'
    return null
}

function readPersisted(): CatalogUIPersisted {
    if (typeof window === 'undefined') return {}
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw) as CatalogUIPersisted
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
        return {}
    }
}

function writePersisted(partial: CatalogUIPersisted) {
    if (typeof window === 'undefined') return
    try {
        const current = readPersisted()
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...partial }))
    } catch {
        // ignore quota / private mode
    }
}

export function CatalogUIProvider({ children }: { children: ReactNode }) {
    const { currency: currencyFromHook, setCurrency: setCurrencyFromHook } = useCurrency()
    const [hydrated, setHydrated] = useState(false)

    const [state, setState] = useState<CatalogUIState>({
        ...DEFAULT_STATE,
        currency: currencyFromHook || 'ARS',
    })

    // Cargar preferencias guardadas en el cliente (evita mismatch SSR)
    useEffect(() => {
        const saved = readPersisted()
        const viewMode = normalizeViewMode(saved.viewMode)
        setState((prev) => ({
            ...prev,
            showPurchasePrice:
                typeof saved.showPurchasePrice === 'boolean'
                    ? saved.showPurchasePrice
                    : prev.showPurchasePrice,
            showPublicPrice:
                typeof saved.showPublicPrice === 'boolean'
                    ? saved.showPublicPrice
                    : prev.showPublicPrice,
            markupPercentage:
                typeof saved.markupPercentage === 'number' && Number.isFinite(saved.markupPercentage)
                    ? Math.max(0, Math.min(100, saved.markupPercentage))
                    : prev.markupPercentage,
            viewMode: viewMode ?? prev.viewMode,
        }))
        setHydrated(true)
    }, [])

    // Sincronizar currency con CurrencyContext
    useEffect(() => {
        setState(prev => ({ ...prev, currency: currencyFromHook || 'ARS' }))
    }, [currencyFromHook])

    // Persistencia (solo después de hidratar, para no pisar LS con defaults)
    useEffect(() => {
        if (!hydrated) return
        writePersisted({
            showPurchasePrice: state.showPurchasePrice,
            showPublicPrice: state.showPublicPrice,
            markupPercentage: state.markupPercentage,
            viewMode: state.viewMode,
        })
    }, [
        hydrated,
        state.showPurchasePrice,
        state.showPublicPrice,
        state.markupPercentage,
        state.viewMode,
    ])

    const togglePurchasePrice = useCallback(() => {
        setState(prev => ({ ...prev, showPurchasePrice: !prev.showPurchasePrice }))
    }, [])

    const togglePublicPrice = useCallback(() => {
        setState(prev => ({ ...prev, showPublicPrice: !prev.showPublicPrice }))
    }, [])

    const setMarkupPercentage = useCallback((value: number) => {
        setState(prev => ({ ...prev, markupPercentage: Math.max(0, Math.min(100, value)) }))
    }, [])

    const setCurrency = useCallback((value: 'ARS' | 'USD') => {
        setState(prev => ({ ...prev, currency: value }))
        setCurrencyFromHook(value)
    }, [setCurrencyFromHook])

    const setViewMode = useCallback((value: CatalogViewMode) => {
        setState(prev => ({ ...prev, viewMode: value }))
    }, [])

    return (
        <CatalogUIContext.Provider
            value={{
                ...state,
                togglePurchasePrice,
                togglePublicPrice,
                setMarkupPercentage,
                setCurrency,
                setViewMode,
            }}
        >
            {children}
        </CatalogUIContext.Provider>
    )
}

export function useCatalogUI() {
    const context = useContext(CatalogUIContext)
    if (context === undefined) {
        throw new Error('useCatalogUI must be used within a CatalogUIProvider')
    }
    return context
}
