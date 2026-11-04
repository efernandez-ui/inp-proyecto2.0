import type { ProductoDTO } from '@/interfaces/producto';

export const API_BASE_URL = `${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BACKEND}/api`;

// Helper para obtener headers con token opcional
export const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  // Agregar token si existe (usuario logueado)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};
export interface Product {
  id: string;
  name: string;
}
export const getProducts = async (): Promise<Product[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  return data;
};

export const getProductById = async (tippro: string, artcod: string, nrocta?: string): Promise<any> => {
  // Use private endpoint if token is present to get accurate pricing
  const token = localStorage.getItem('authToken');
  const endpoint = token ? `${API_BASE_URL}/productos/full` : `${API_BASE_URL}/public/productos/full`;
  const nroctaParam = nrocta ? `?nrocta=${encodeURIComponent(nrocta)}` : '';

  try {
    const response = await fetch(`${endpoint}/${encodeURIComponent(tippro)}/${encodeURIComponent(artcod)}${nroctaParam}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Get product details failed', e);
  }

  return null;
};

export interface Sugerencia {
  descripcion: string;
  tippro: string;
  artcod: string;
  artdcod?: string; // Para compatibilidad con el typo del backend
  codigoCompleto?: string;
}

export const searchProduct = async (query: string): Promise<Sugerencia[]> => {
  const response = await fetch(`${API_BASE_URL}/public/productos/sugerencias?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch suggestions');
  }
  const data = await response.json();
  return data;
};

/**
 * Busca productos por código de artículo parcial.
 * Útil para autocompletado de códigos en el frontend.
 * 
 * @param partialCode Parte del código de artículo a buscar
 * @param page Número de página (default 0)
 * @param size Tamaño de página (default 10)
 * @returns Promise con la página de productos encontrados
 */
export const searchProductsByCode = async (
  partialCode: string,
  page: number = 0,
  size: number = 10
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/public/productos/es/search?q=${encodeURIComponent(partialCode)}&page=${page}&size=${size}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to search products by code');
  }
  return await response.json();
};

/**
 * Busca un producto por código interno.
 * El código debe tener el formato: 3 dígitos para tippro + código de producto.
 * Ejemplo: "002001010001" donde "002" es tippro y "001010001" es artcod
 * 
 * @param internalCode Código interno del producto (puede ser parcial o completo)
 * @returns Promise con el producto encontrado o null
 */
export const searchProductByInternalCode = async (internalCode: string): Promise<any | null> => {
  const code = internalCode.trim();

  if (code.length < 3) {
    return null;
  }

  const tippro = code.substring(0, 3);
  const artcod = code.substring(3);

  // Siempre usar el endpoint público para buscar el producto
  const endpoint = '/public/productos/full';

  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}/${encodeURIComponent(tippro)}/${encodeURIComponent(artcod)}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Error buscando producto por código interno:', e);
  }

  return null;
};

const fetchProductosVinculados = async (
  tipo: 'sustitutos' | 'relacionados',
  tippro: string,
  artcod: string,
  nrocta?: string,
): Promise<ProductoDTO[]> => {
  const token = localStorage.getItem('authToken');
  const base = token ? `${API_BASE_URL}/productos/full` : `${API_BASE_URL}/public/productos/full`;
  const nroctaParam = nrocta ? `?nrocta=${encodeURIComponent(nrocta)}` : '';
  const url = `${base}/${encodeURIComponent(tippro)}/${encodeURIComponent(artcod)}/${tipo}${nroctaParam}`;

  try {
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (response.ok) {
      return (await response.json()) as ProductoDTO[];
    }
  } catch (e) {
    console.warn(`Error obteniendo ${tipo}`, e);
  }
  return [];
};

export const fetchSustitutos = (tippro: string, artcod: string, nrocta?: string) =>
  fetchProductosVinculados('sustitutos', tippro, artcod, nrocta);

export const fetchRelacionados = (tippro: string, artcod: string, nrocta?: string) =>
  fetchProductosVinculados('relacionados', tippro, artcod, nrocta);