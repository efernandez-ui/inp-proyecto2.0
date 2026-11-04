'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  fetchActiveCart,
  fetchCarts,
  loadFullCart,
  resetStaffCartWithoutClient,
} from '../../store/cartSlice';
import { isStaff } from '../../utils/auth';

/** Copia legacy del carrito (ítems + precios). Ya no se usa: mostraba precios viejos tras un sync. */
const LEGACY_CART_STORAGE_KEY = 'intercap_cart';

export default function CartInitializer() {
    const dispatch = useDispatch<AppDispatch>();
    const store = useStore<RootState>();
    const { isLoggedIn, selectedClient, user } = useSelector((state: RootState) => state.auth);
    const prevNroctaRef = useRef<string | undefined>(undefined);

    // 1. Solo se rehidratan las pestañas; ítems y precios siempre vienen del backend
    useEffect(() => {
        localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
        dispatch({ type: 'cart/rehydrateTabs' });
    }, [dispatch]);

    // 2. Sincronizar con backend cuando cambie el estado de login o cliente seleccionado
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!isLoggedIn || !token) return;
        // Evitar carrera: con user aún undefined, isStaff(user) es false y se listaban carritos como cliente final.
        if (!user) return;

        if (isStaff(user) && !selectedClient) {
            dispatch(resetStaffCartWithoutClient());
            prevNroctaRef.current = undefined;
            return;
        }

        const nrocta = selectedClient?.nrocta;
        const nroctaKey = (nrocta || '').trim();

        // Staff/comercial: siempre carrito propio (GET active crea uno si no hay).
        // No rehidratar un id de solo lectura desde localStorage.
        if (isStaff(user)) {
            const clientChanged =
                prevNroctaRef.current !== undefined && prevNroctaRef.current !== nroctaKey;
            if (clientChanged) {
                dispatch(resetStaffCartWithoutClient());
            }
            prevNroctaRef.current = nroctaKey;
            dispatch(fetchActiveCart({ token, nrocta }));
            dispatch(fetchCarts({ token, nrocta }));
            return;
        }

        prevNroctaRef.current = nroctaKey;

        // Cliente: respetar pestaña vigente si sigue abierta; si no → activo/crear.
        const selectedCartId = store.getState().cart.activeCartId;
        if (selectedCartId != null) {
            dispatch(loadFullCart({ id: selectedCartId, token, refresh: true }));
        } else {
            dispatch(fetchActiveCart({ token, nrocta }));
        }

        dispatch(fetchCarts({
            token,
            nrocta,
        }));
    }, [isLoggedIn, selectedClient, user, dispatch, store]);

    return null;
}
