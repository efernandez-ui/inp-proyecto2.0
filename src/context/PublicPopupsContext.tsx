'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ConoceloModal from '@/components/home/ConoceloModal'
import SucursalesModal from '@/components/home/SucursalesModal'

type PublicPopup = 'sucursales' | 'conocelo' | null

type PublicPopupsContextValue = {
  openSucursales: () => void
  openConocelo: () => void
}

const PublicPopupsContext = createContext<PublicPopupsContextValue | null>(null)

export function PublicPopupsProvider({ children }: { children: React.ReactNode }) {
  const [popup, setPopup] = useState<PublicPopup>(null)

  const openSucursales = useCallback(() => setPopup('sucursales'), [])
  const openConocelo = useCallback(() => setPopup('conocelo'), [])
  const close = useCallback(() => setPopup(null), [])

  const value = useMemo(
    () => ({ openSucursales, openConocelo }),
    [openSucursales, openConocelo]
  )

  return (
    <PublicPopupsContext.Provider value={value}>
      {children}
      <SucursalesModal isOpen={popup === 'sucursales'} onClose={close} />
      <ConoceloModal isOpen={popup === 'conocelo'} onClose={close} />
    </PublicPopupsContext.Provider>
  )
}

export function usePublicPopups() {
  const ctx = useContext(PublicPopupsContext)
  if (!ctx) {
    throw new Error('usePublicPopups must be used within PublicPopupsProvider')
  }
  return ctx
}
