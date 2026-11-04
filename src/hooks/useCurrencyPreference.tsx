import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export type Currency = 'USD' | 'ARS'

interface CurrencyContextType {
    currency: Currency
    setCurrency: (currency: Currency) => void
    toggleCurrency: () => void
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_STORAGE_KEY = 'intercap_currency_preference'

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(CURRENCY_STORAGE_KEY)
            if (saved === 'USD' || saved === 'ARS') {
                return saved
            }
        }
        return 'ARS' // Default preference
    })

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency)
        if (typeof window !== 'undefined') {
            localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency)
        }
    }

    const toggleCurrency = () => {
        setCurrency(currency === 'USD' ? 'ARS' : 'USD')
    }

    useEffect(() => {
        // Sincronizar con localStorage en el cliente
        const saved = localStorage.getItem(CURRENCY_STORAGE_KEY)
        if (saved === 'USD' || saved === 'ARS') {
            setCurrencyState(saved)
        }
    }, [])

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}
