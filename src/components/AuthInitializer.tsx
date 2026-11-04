'use client';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ApiUnavailableError, getProfile, SessionExpiredError } from '../services/auth';
import { login, logout as logoutAuth, setLoading, setSelectedClient } from '../store/authSlice';
import { fetchFavorites } from '../store/favoritesSlice';
import { loadCotizacionDolar } from '../utils/loadCotizacionDolar';
import { isStaff } from '../utils/auth';
import type { AppDispatch } from '../store';
export default function AuthInitializer() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            getProfile()
                .then((user) => {
                    dispatch(login(user));
                    dispatch(fetchFavorites({ token }));
                    loadCotizacionDolar(dispatch);
                    
                    // Restaurar el cliente seleccionado si está en localStorage y opera "por cliente"
                    // (vendedor/admin/SAI/usuario sitio).
                    if (isStaff(user)) {
                        const savedClient = localStorage.getItem('selectedClient');
                        if (savedClient) {
                            try {
                                dispatch(setSelectedClient(JSON.parse(savedClient)));
                            } catch (e) {
                                console.error('Error parsing saved client:', e);
                                localStorage.removeItem('selectedClient');
                            }
                        }
                    }
                })
                .catch((error) => {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('selectedClient');
                    dispatch(logoutAuth());
                    dispatch(setLoading(false));

                    // Sin ?login=1: no abrir el modal de login automáticamente (solo toast + inicio).
                    if (error instanceof SessionExpiredError) {
                        toast.error('Tu sesión expiró. Te llevamos al inicio.');
                        router.replace('/');
                        return;
                    }
                    if (error instanceof ApiUnavailableError) {
                        toast.error('No se pudo validar la sesión. Intentá de nuevo.');
                        router.replace('/');
                        return;
                    }
                });
        } else {
            localStorage.removeItem('selectedClient');
            dispatch(setLoading(false));
        }
    }, [dispatch, router]);
    return null;
}