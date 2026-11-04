'use client';

import ProductList from './ProductList'
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toast } from 'react-toastify';
import { getHeaders } from '@/services/products';
import { isStaff } from '@/utils/auth';

interface CatalogGridProps {
    searchParams: {
        [key: string]: string | string[] | undefined
        rubro?: string
        subtipo?: string
        tipo?: string
        marca?: string
        q?: string
        page?: string
        fabricante?: string
        modelo?: string
        cilindrada?: string
        version?: string
        anio?: string
        sortBy?: string
        sortOrder?: string
        moneda?: string
        tippro?: string
        artcod?: string
        nrocta?: string
        ofertas?: string
        nroPool?: string
        novedades?: string
        stockDisponible?: string
        variacionPrecio?: string
        stockBue?: string
        stockCuy?: string
        stockNea?: string
        stockNoa?: string
    }
}

export default function CatalogGrid({ searchParams }: CatalogGridProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { selectedClient, user } = useSelector((state: RootState) => state.auth);
    const selectedClientNrocta = (selectedClient?.nrocta || '').trim();
    const userTipo = (user?.tipo || '').trim();

    // Construir parámetros de búsqueda
    const params = useMemo(() => {
        const p = new URLSearchParams();
        if (searchParams.rubro) p.append('rubro', searchParams.rubro);
        if (searchParams.subtipo) p.append('subtipo', searchParams.subtipo);
        if (searchParams.tipo) p.append('tipo', searchParams.tipo);
        if (searchParams.marca) p.append('marca', searchParams.marca);
        if (searchParams.q) p.append('q', searchParams.q);
        if (searchParams.tippro) p.append('tippro', searchParams.tippro);
        if (searchParams.artcod) p.append('artcod', searchParams.artcod);
        if (searchParams.page) p.append('page', (Number(searchParams.page) - 1).toString());
        if (searchParams.fabricante) p.append('appFabricante', searchParams.fabricante);
        if (searchParams.modelo) p.append('appModelo', searchParams.modelo);
        if (searchParams.cilindrada) p.append('appCilindrada', searchParams.cilindrada);
        if (searchParams.version) p.append('appVersion', searchParams.version);
        if (searchParams.anio) {
            p.append('annios', searchParams.anio);
        }
        if (searchParams.sortBy) p.append('sortBy', searchParams.sortBy);
        if (searchParams.sortOrder) p.append('sortOrder', searchParams.sortOrder);
        if (searchParams.moneda && typeof searchParams.moneda === 'string') p.append('moneda', searchParams.moneda);
        if (searchParams.nrocta && typeof searchParams.nrocta === 'string') p.append('nrocta', searchParams.nrocta);
        if (searchParams.nroPool && typeof searchParams.nroPool === 'string') {
            p.append('nroPool', searchParams.nroPool);
            p.append('ofertas', 'true');
        }

        // Filtros adicionales (legacy CatalogoBean)
        const flagParams = ['ofertas', 'novedades', 'stockDisponible', 'variacionPrecio', 'stockBue', 'stockCuy', 'stockNea', 'stockNoa'] as const
        for (const key of flagParams) {
            const v = searchParams[key]
            if (v === 'true' || (Array.isArray(v) && v.includes('true'))) {
                p.append(key, 'true')
            }
        }

        // Cliente seleccionado (staff) o cliente logueado (tipo C): nrocta para bonificaciones y ofertas
        if (!searchParams.nrocta && selectedClientNrocta && (isStaff(user) || userTipo === 'C')) {
            p.append('nrocta', selectedClientNrocta);
        }

        // Agregar todos los parámetros de atributos (attr_*)
        if (searchParams) {
            Object.keys(searchParams).forEach(key => {
                if (key.startsWith('attr_') && searchParams[key]) {
                    const value = searchParams[key];
                    if (Array.isArray(value)) {
                        value.forEach(v => p.append(key, v));
                    } else {
                        p.append(key, value);
                    }
                }
            });
        }

        p.append('size', '20');
        return p;
    }, [searchParams, selectedClientNrocta, userTipo, user]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const url = `/api/catalogo/search?${params.toString()}`;

                const res = await fetch(url, {
                    headers: getHeaders(),
                    cache: 'no-store',
                });

                // Manejar error de autenticación
                if (res.status === 401) {
                    console.warn('Token expirado o inválido (catálogo), redirigiendo al inicio');
                    try {
                        localStorage.removeItem('authToken');
                    } catch {
                        /* ignore */
                    }
                    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    toast.error('Tu sesión expiró. Te llevamos al inicio.');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 500);
                    return;
                }

                if (!res.ok) {
                    throw new Error('Error al buscar productos');
                }
                const resultData = await res.json();
                setData(resultData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.toString()]);

    // Construir URLSearchParams para el ProductList
    const urlSearchParams = useMemo(() => {
        const p = new URLSearchParams();
        if (searchParams.rubro) p.set('rubro', searchParams.rubro);
        if (searchParams.subtipo) p.set('subtipo', searchParams.subtipo);
        if (searchParams.tipo) p.set('tipo', searchParams.tipo);
        if (searchParams.marca) p.set('marca', searchParams.marca);
        if (searchParams.q) p.set('q', searchParams.q);
        if (searchParams.fabricante) p.set('fabricante', searchParams.fabricante);
        if (searchParams.modelo) p.set('modelo', searchParams.modelo);
        if (searchParams.cilindrada) p.set('cilindrada', searchParams.cilindrada);
        if (searchParams.version) p.set('version', searchParams.version);
        if (searchParams.anio) p.set('anio', searchParams.anio);
        if (searchParams.sortBy) p.set('sortBy', searchParams.sortBy);
        if (searchParams.sortOrder) p.set('sortOrder', searchParams.sortOrder);
        if (searchParams.moneda) p.set('moneda', searchParams.moneda);
        if (searchParams.tippro) p.set('tippro', searchParams.tippro);
        if (searchParams.artcod) p.set('artcod', searchParams.artcod);
        if (searchParams.nroPool && typeof searchParams.nroPool === 'string') {
            p.set('nroPool', searchParams.nroPool);
            p.set('ofertas', 'true');
        }

        const flagParams = ['ofertas', 'novedades', 'stockDisponible', 'variacionPrecio', 'stockBue', 'stockCuy', 'stockNea', 'stockNoa'] as const
        for (const key of flagParams) {
            const v = searchParams[key]
            if (v === 'true' || (Array.isArray(v) && v.includes('true'))) {
                p.set(key, 'true')
            }
        }

        // Agregar todos los parámetros de atributos (attr_*)
        if (searchParams) {
            Object.keys(searchParams).forEach(key => {
                if (key.startsWith('attr_') && searchParams[key]) {
                    const value = searchParams[key];
                    if (Array.isArray(value)) {
                        value.forEach(v => p.set(key, v));
                    } else {
                        p.set(key, value);
                    }
                }
            });
        }

        return p;
    }, [searchParams]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-red-600">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <ProductList
            data={data}
            currentPage={Number(searchParams.page ?? 1) - 1}
            searchParams={urlSearchParams}
        />
    );
}

// Keep the server function for backward compatibility but it won't be used
export async function getProductos(searchParams: any) {
    return { content: [], totalElements: 0, totalPages: 0 };
}
