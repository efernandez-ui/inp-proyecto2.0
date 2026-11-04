'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { updateItemBackend } from '@/store/cartSlice'
import { toast } from 'react-toastify'

type Params = {
    isInCart: boolean
    cartItemId: number | undefined
    cartQuantity: number | undefined
    activeCartId: number | undefined
}

/**
 * Cantidad local para UI de catálogo / ficha.
 * Si el ítem está en el carrito, se sincroniza con `cartQuantity` y los cambios
 * se envían al backend (debounced) vía `updateItemBackend`.
 */
export function useSyncedCartQuantity({
    isInCart,
    cartItemId,
    cartQuantity,
    activeCartId,
}: Params) {
    const dispatch = useDispatch<AppDispatch>()
    const [quantity, setQuantity] = useState(1)
    const [isUpdatingQty, setIsUpdatingQty] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const prevInCartRef = useRef(false)
    const lastServerQtyRef = useRef(1)

    useEffect(() => {
        if (!isInCart) return
        if (cartQuantity == null) return
        const q = Math.max(1, Math.floor(Number(cartQuantity)))
        if (Number.isNaN(q)) return
        setQuantity(q)
        lastServerQtyRef.current = q
    }, [isInCart, cartItemId, cartQuantity])

    useEffect(() => {
        if (prevInCartRef.current && !isInCart) {
            setQuantity(1)
            lastServerQtyRef.current = 1
        }
        prevInCartRef.current = isInCart
    }, [isInCart])

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        },
        []
    )

    const pushQuantityToBackend = useCallback(
        async (next: number) => {
            const token = localStorage.getItem('authToken')
            if (!token || !activeCartId || !cartItemId) return
            setIsUpdatingQty(true)
            try {
                await dispatch(
                    updateItemBackend({
                        cartId: activeCartId,
                        itemId: cartItemId,
                        updates: { quantity: next },
                        token,
                    })
                ).unwrap()
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'No se pudo actualizar la cantidad'
                toast.error(msg)
                setQuantity(lastServerQtyRef.current)
            } finally {
                setIsUpdatingQty(false)
            }
        },
        [dispatch, activeCartId, cartItemId]
    )

    /** Cambia cantidad en UI; si está en carrito, persiste con debounce. */
    const setQuantityFromUi = useCallback(
        (nextRaw: number) => {
            const next = Math.max(1, Math.floor(nextRaw) || 1)
            setQuantity(next)
            if (!isInCart || !activeCartId || !cartItemId) return
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
                debounceRef.current = null
                void pushQuantityToBackend(next)
            }, 400)
        },
        [isInCart, activeCartId, cartItemId, pushQuantityToBackend]
    )

    return { quantity, setQuantityFromUi, isUpdatingQty }
}
