'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { updateItemBackend } from '@/store/cartSlice'
import { toast } from 'react-toastify'

const DEBOUNCE_MS = 400

/** Serializa PUTs de cantidad por itemId para evitar respuestas fuera de orden. */
const inFlightByItem = new Map<number, Promise<unknown>>()

type Params = {
  cartId: number
  itemId: number | undefined
  serverQuantity: number
}

/**
 * Cantidad optimista con debounce para la vista de carrito (+/-).
 */
export function useCartQuantitySync({ cartId, itemId, serverQuantity }: Params) {
  const dispatch = useDispatch<AppDispatch>()
  const [localQuantity, setLocalQuantity] = useState(serverQuantity)
  const [isUpdatingQty, setIsUpdatingQty] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingQtyRef = useRef(serverQuantity)
  const lastServerQtyRef = useRef(serverQuantity)

  useEffect(() => {
    const q = Math.max(1, Math.floor(Number(serverQuantity)))
    if (Number.isNaN(q)) return
    setLocalQuantity(q)
    pendingQtyRef.current = q
    lastServerQtyRef.current = q
  }, [itemId, serverQuantity])

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    []
  )

  const pushQuantityToBackend = useCallback(
    async (next: number) => {
      const token = localStorage.getItem('authToken')
      if (!token || !itemId) return

      setIsUpdatingQty(true)
      const run = async () => {
        try {
          await dispatch(
            updateItemBackend({
              cartId,
              itemId,
              updates: { quantity: next },
              token,
            })
          ).unwrap()
          lastServerQtyRef.current = next
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'No se pudo actualizar la cantidad'
          toast.error(msg)
          setLocalQuantity(lastServerQtyRef.current)
          pendingQtyRef.current = lastServerQtyRef.current
        } finally {
          setIsUpdatingQty(false)
        }
      }

      const previous = inFlightByItem.get(itemId) ?? Promise.resolve()
      const current = previous.catch(() => undefined).then(run)
      inFlightByItem.set(itemId, current)
      await current
      if (inFlightByItem.get(itemId) === current) {
        inFlightByItem.delete(itemId)
      }
    },
    [dispatch, cartId, itemId]
  )

  const scheduleQuantityUpdate = useCallback(
    (nextRaw: number) => {
      const next = Math.max(1, Math.floor(nextRaw) || 1)
      setLocalQuantity(next)
      pendingQtyRef.current = next
      if (!itemId) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        void pushQuantityToBackend(pendingQtyRef.current)
      }, DEBOUNCE_MS)
    },
    [itemId, pushQuantityToBackend]
  )

  const increment = useCallback(() => {
    scheduleQuantityUpdate(pendingQtyRef.current + 1)
  }, [scheduleQuantityUpdate])

  const decrement = useCallback(() => {
    if (pendingQtyRef.current <= 1) return
    scheduleQuantityUpdate(pendingQtyRef.current - 1)
  }, [scheduleQuantityUpdate])

  return { localQuantity, increment, decrement, isUpdatingQty }
}
