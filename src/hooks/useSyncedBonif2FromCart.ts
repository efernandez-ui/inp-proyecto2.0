'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { updateItemBackend } from '@/store/cartSlice'
import { toast } from 'react-toastify'

type Params = {
  isInCart: boolean
  cartBonificacion2: number | null | undefined
  cartItemId: number | undefined
  activeCartId: number | undefined
  /** Valor de catálogo (ProductoDTO) cuando el ítem aún no está en el carrito */
  catalogBonificacion2?: number | null
  /** p.ej. tippro-artcod para alinear con cambios de producto */
  productKey?: string
}

/**
 * Bonif. 2 % (UI muestra magnitud; backend guarda descuento negativo).
 * - Si el ítem ya está en el carrito: precarga desde la línea.
 * - Si no está en el carrito: precarga desde `catalogBonificacion2` (API / searchProductES).
 * - Si el usuario modifica y está en carrito: persiste con debounce vía `updateItemBackend`.
 */
export function useSyncedBonif2FromCart({
  isInCart,
  cartBonificacion2,
  cartItemId,
  activeCartId,
  catalogBonificacion2,
  productKey,
}: Params) {
  const dispatch = useDispatch<AppDispatch>()
  const [bonif2, setBonif2] = useState(0)
  const [isUpdatingBonif2, setIsUpdatingBonif2] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastServerValRef = useRef(0)

  useEffect(() => {
    if (!isInCart) return
    const b2 = cartBonificacion2
    const display = b2 == null ? 0 : Math.abs(Number(b2) || 0)
    const safe = Number.isFinite(display) ? display : 0
    setBonif2(safe)
    lastServerValRef.current = safe
  }, [isInCart, cartItemId, cartBonificacion2])

  useEffect(() => {
    if (isInCart) return
    const raw = catalogBonificacion2
    const display = raw == null || raw === undefined ? 0 : Math.abs(Number(raw) || 0)
    const safe = Number.isFinite(display) ? display : 0
    setBonif2(safe)
    lastServerValRef.current = safe
  }, [isInCart, catalogBonificacion2, productKey])

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    []
  )

  const pushToBackend = useCallback(
    async (nextDisplay: number) => {
      const token = localStorage.getItem('authToken')
      if (!token || !activeCartId || !cartItemId) return
      setIsUpdatingBonif2(true)
      try {
        const backendVal = nextDisplay === 0 ? 0 : -Math.abs(nextDisplay)
        await dispatch(
          updateItemBackend({
            cartId: activeCartId,
            itemId: cartItemId,
            updates: { bonificacion2: backendVal },
            token,
          })
        ).unwrap()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'No se pudo actualizar la bonificación'
        toast.error(msg)
        setBonif2(lastServerValRef.current)
      } finally {
        setIsUpdatingBonif2(false)
      }
    },
    [dispatch, activeCartId, cartItemId]
  )

  const setBonif2FromUi = useCallback(
    (nextRaw: number) => {
      const n = Number(nextRaw)
      const next = Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0
      setBonif2(next)
      if (!isInCart || !activeCartId || !cartItemId) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        void pushToBackend(next)
      }, 400)
    },
    [isInCart, activeCartId, cartItemId, pushToBackend]
  )

  return { bonif2, setBonif2FromUi, isUpdatingBonif2 }
}
