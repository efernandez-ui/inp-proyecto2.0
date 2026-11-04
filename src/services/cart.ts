import { readApiErrorMessage } from '@/utils/apiError';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BACKEND}/api/cart`;

export const getCarts = async (token: string, nrocta?: string) => {
    const url = nrocta ? `${API_BASE_URL}/list?nrocta=${nrocta}` : `${API_BASE_URL}/list`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to fetch carts');
    return response.json();
};

export const getActiveCart = async (token: string, nrocta?: string) => {
    const url = nrocta ? `${API_BASE_URL}/active?nrocta=${nrocta}` : `${API_BASE_URL}/active`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to fetch active cart');
    return response.json();
};

export const getCart = async (id: number, token: string, refresh = true) => {
    const refreshParam = refresh ? '' : '?refresh=false';
    const response = await fetch(`${API_BASE_URL}/${id}${refreshParam}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
};

export const CART_READONLY_CODE = 'READONLY';

export const addItem = async (cartId: number, tippro: string, artcod: string, quantity: number, token: string, nrocta?: string, bonificacion2?: number) => {
    const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId, tippro, artcod, quantity, nrocta, bonificacion2 }),
    });
    if (!response.ok) {
        const errorMsg = await response.text();
        const err = new Error(errorMsg || 'Failed to add item') as Error & { code?: string };
        // 403 = carrito de solo lectura (generado por el cliente)
        if (response.status === 403) err.code = CART_READONLY_CODE;
        throw err;
    }
    return response.json();
};

export const updateQuantity = async (itemId: number, quantity: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/update`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity }),
    });
    if (!response.ok) throw new Error('Failed to update quantity');
    return response.json();
};

export const removeItem = async (cartId: number, nroitm: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/remove/${cartId}/${nroitm}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to remove item');
    return response.json();
};

export const checkout = async (cartId: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId }),
    });
    if (!response.ok) {
        const errorMsg = await readApiErrorMessage(response, 'No se pudo confirmar el pedido');
        throw new Error(errorMsg);
    }
    return response.json();
};

export const deleteCart = async (id: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to delete cart');
};

export const updateCart = async (id: number, updates: Record<string, any>, token: string) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update cart');
  return response.json();
};

export interface DireccionEntrega {
  nrocta?: string | null;
  cdentr: string;
  direcc?: string | null;
  descrp?: string | null;
  codpos?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  codpai?: string | null;
  jurisd?: string | null;
  label: string;
  retiraEnDeposito?: boolean;
}

export const getDireccionesEntrega = async (
  cartId: number,
  token: string
): Promise<DireccionEntrega[]> => {
  const response = await fetch(`${API_BASE_URL}/${cartId}/direcciones-entrega`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(msg || 'No se pudieron cargar las direcciones de entrega');
  }
  return response.json();
};

export const updateItem = async (cartId: number, nroitm: number, updates: Record<string, any>, token: string) => {
  const response = await fetch(`${API_BASE_URL}/item/${cartId}/${nroitm}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Failed to update item');
  }
  return response.json();
};

export const createNewCart = async (nrocta: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/new?nrocta=${nrocta}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to create new cart');
  return response.json();
};

export type CartImportItemPayload = {
  codigo: string;
  cantidad: number;
  row?: number;
};

export type CartImportError = {
  row: number;
  codigo: string;
  message: string;
};

export type CartImportResponse = {
  cart: any;
  imported: number;
  errors: CartImportError[];
};

export const importCartItems = async (
  cartId: number,
  items: CartImportItemPayload[],
  token: string,
  nrocta?: string
): Promise<CartImportResponse> => {
  const response = await fetch(`${API_BASE_URL}/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cartId, nrocta, items }),
  }).catch(() => null);
  if (!response) {
    throw new Error('No se pudo conectar con el servidor. Verificá que el backend esté en marcha.');
  }
  if (!response.ok) {
    const errorMsg = await readApiErrorMessage(response, 'No se pudo importar el Excel');
    throw new Error(errorMsg);
  }
  return response.json();
};
