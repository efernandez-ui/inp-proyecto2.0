import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../interfaces/cart';
import { ProductUI } from '../models/ProductUI';
import * as cartService from '../services/cart';
import { extractErrorMessage } from '../utils/apiError';
import { mapBackendCartResponse, MappedCartPayload } from '../utils/mapBackendCart';

/** TTL de cache en memoria para cambio instantáneo de pestaña. */
export const CART_CACHE_TTL_MS = 2 * 60 * 1000;

type CachedCartEntry = NonNullable<CartState['cartsById']>[number];

// Thunks para sincronización con Backend
const saveCartToStorage = (activeCartId?: number, openCarts?: CartState['openCarts']) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('intercap_active_cart', JSON.stringify({ activeCartId, openCarts }));
  }
};

const buildCacheEntry = (payload: MappedCartPayload): CachedCartEntry => ({
  payload: {
    items: payload.items,
    notes: payload.notes ?? '',
    totalAmount: payload.items.reduce((sum, item) => sum + item.subtotal, 0),
    totalWeight: payload.items.reduce((sum, item) => sum + item.weightTotal, 0),
    nroPool: payload.nroPool,
    nrofor: payload.nrofor,
    nrocta: payload.nrocta,
    nombreCliente: payload.nombreCliente,
    titulo: payload.titulo,
    fecha: payload.fecha,
    importeContribucionMarginalTotal: payload.importeContribucionMarginalTotal ?? undefined,
    porcentajeContribucionMarginalTotal: payload.porcentajeContribucionMarginalTotal ?? undefined,
    cdent1: payload.cdent1 ?? undefined,
    direccionEntrega: payload.direccionEntrega ?? undefined,
    codigoEntrega: payload.codigoEntrega ?? undefined,
    transporteCodigo: payload.transporteCodigo ?? undefined,
    transporteNombre: payload.transporteNombre ?? undefined,
    transporteCuit: payload.transporteCuit ?? undefined,
    transporteDireccion: payload.transporteDireccion ?? undefined,
    activeCartId: payload.nrofor,
    openCarts: [],
  },
  fetchedAt: Date.now(),
});

export const fetchActiveCart = createAsyncThunk(
  'cart/fetchActive',
  async ({ token, nrocta }: { token: string; nrocta?: string }, { dispatch }) => {
    const backendCart = await cartService.getActiveCart(token, nrocta);
    if (!backendCart || !backendCart.id) return;
    return await dispatch(loadFullCart({ id: backendCart.id, token, refresh: true })).unwrap();
  }
);

export const fetchCarts = createAsyncThunk(
  'cart/fetchCarts',
  async ({ token, nrocta }: { token: string; nrocta?: string }, { getState, dispatch }) => {
    const carts = await cartService.getCarts(token, nrocta);
    // Tras el reducer fulfilled: si hay activeCartId reconciliado sin detalle, cargarlo.
    void Promise.resolve().then(() => {
      const state = (getState() as { cart: CartState }).cart;
      const id = state.activeCartId;
      if (id == null || !state.openCarts?.some((c) => c.id === id)) return;
      if (state.nrofor !== id || state.items.length === 0 || state.cartStale?.[id]) {
        dispatch(loadFullCart({ id, token, refresh: true }));
      }
    });
    return carts;
  }
);

export const addItemToBackend = createAsyncThunk(
  'cart/addItem',
  async (
    { cartId, product, quantity, token, nrocta, bonificacion2 }: { cartId: number; product: ProductUI; quantity: number; token: string; nrocta?: string; bonificacion2?: number },
    { getState, rejectWithValue },
  ) => {
    const tab = (getState() as { cart: CartState }).cart.openCarts?.find((c) => c.id === cartId);
    if (tab?.editable === false) {
      return rejectWithValue({ code: cartService.CART_READONLY_CODE });
    }
    try {
      return await cartService.addItem(cartId, product.tippro, product.artcod, quantity, token, nrocta, bonificacion2);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === cartService.CART_READONLY_CODE) return rejectWithValue({ code });
      throw e;
    }
  }
);

export const importCartItemsBackend = createAsyncThunk(
  'cart/importItems',
  async (
    {
      cartId,
      items,
      token,
      nrocta,
    }: {
      cartId: number;
      items: cartService.CartImportItemPayload[];
      token: string;
      nrocta?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await cartService.importCartItems(cartId, items, token, nrocta);
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'No se pudo importar el Excel',
      );
    }
  },
);

export const updateItemBackend = createAsyncThunk(
  'cart/updateItem',
  async ({ cartId, itemId, updates, token }: { cartId: number; itemId: number; updates: Record<string, any>; token: string }) => {
    return await cartService.updateItem(cartId, itemId, updates, token);
  }
);

export const updateCartBackend = createAsyncThunk(
  'cart/updateCart',
  async ({ cartId, updates, token }: { cartId: number; updates: Record<string, any>; token: string }, { dispatch }) => {
    return await cartService.updateCart(cartId, updates, token);
  }
);

export const removeItemFromBackend = createAsyncThunk(
  'cart/removeItem',
  async ({ cartId, itemId, token }: { cartId: number; itemId: number; token: string }) => {
    return await cartService.removeItem(cartId, itemId, token);
  }
);

export const checkoutCart = createAsyncThunk(
  'cart/checkout',
  async ({ cartId, token }: { cartId: number; token: string }, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await cartService.checkout(cartId, token);

      const state = getState() as {
        cart: CartState;
        auth?: { selectedClient?: { nrocta?: string }; user?: { nrocta?: string } };
      };
      const { activeCartId } = state.cart;
      const nrocta =
        (state.cart.nrocta ||
          state.auth?.selectedClient?.nrocta ||
          state.auth?.user?.nrocta ||
          '').trim();

      let nextCartId: number | undefined = undefined;
      // Tras confirmar: siempre generar un carrito nuevo propio (no adoptar otro de la lista).
      if (activeCartId === cartId) {
        try {
          const created = await dispatch(
            createNewCartBackend({ nrocta, token }),
          ).unwrap();
          nextCartId = created?.nrofor;
        } catch (createErr) {
          console.error('Checkout OK pero falló crear carrito nuevo:', createErr);
        }
      }

      return { checkoutCartId: cartId, nextCartId, response };
    } catch (error) {
      const message = extractErrorMessage(error, 'Error al confirmar el pedido');
      return rejectWithValue(message);
    }
  }
);

export const deleteCartBackend = createAsyncThunk(
  'cart/delete',
  async ({ cartId, token }: { cartId: number; token: string }, { dispatch, getState }) => {
    await cartService.deleteCart(cartId, token);
    
    const state = getState() as { cart: CartState };
    const { openCarts, activeCartId } = state.cart;
    
    let nextCartId: number | undefined = undefined;
    if (activeCartId === cartId) {
      const remainingCarts = openCarts?.filter(c => c.id !== cartId) || [];
      if (remainingCarts.length > 0) {
        nextCartId = remainingCarts[remainingCarts.length - 1].id;
        await dispatch(loadFullCart({ id: nextCartId, token, refresh: false }));
      }
    }
    
    return { deletedId: cartId, nextCartId };
  }
);

export const createNewCartBackend = createAsyncThunk(
  'cart/createNew',
  async ({ nrocta, token }: { nrocta: string; token: string }, { dispatch }) => {
    const response = await cartService.createNewCart(nrocta, token);
    if (response && response.id) {
      dispatch(addTab({ id: response.id, titulo: response.titulo, nrofor: response.nrofor }));
      return await dispatch(loadFullCart({ id: response.id, token, refresh: true })).unwrap();
    }
    throw new Error('Error al crear el carrito');
  }
);

export const loadFullCart = createAsyncThunk(
  'cart/loadFull',
  async ({ id, token, refresh = true }: { id: number; token: string; refresh?: boolean; background?: boolean }) => {
    if (!id) throw new Error('Cart ID is required');
    try {
      const backendCart = await cartService.getCart(id, token, refresh);
      return mapBackendCartResponse(backendCart);
    } catch (error) {
      console.error('Error loading full cart:', error);
      throw error;
    }
  }
);

/**
 * Cambio de pestaña: activa al instante + refresh en background (sin spinner ni carrera).
 * Siempre recalcula: el carrito activo queda con precios/cotización del día también en BD.
 */
export const switchCartTab = createAsyncThunk(
  'cart/switchTabLoad',
  async ({ id, token }: { id: number; token: string }, { dispatch }) => {
    dispatch(activateCachedCart(id));
    return dispatch(loadFullCart({
      id,
      token,
      refresh: true,
      background: true,
    })).unwrap();
  }
);

/** Al abrir /carrito: refresca ofertas en background sin bloquear la UI. */
export const ensureCartFresh = createAsyncThunk(
  'cart/ensureFresh',
  async ({ id, token }: { id: number; token: string }, { dispatch }) => {
    return dispatch(loadFullCart({
      id,
      token,
      refresh: true,
      background: true,
    })).unwrap();
  }
);

const initialState: CartState = {
  items: [],
  notes: '',
  totalAmount: 0,
  totalWeight: 0,
  loading: false,
  error: null,
  checkoutError: null,
  editable: true,
  cartUsername: null,
  openCarts: [],
  cartsById: {},
  cartStale: {},
  loadGenerationByCartId: {},
  loadRequestGeneration: {},
};

const calculateTotals = (state: CartState) => {
  state.totalAmount = state.items.reduce((sum, item) => sum + item.subtotal, 0);
  state.totalWeight = state.items.reduce((sum, item) => sum + item.weightTotal, 0);
};

const cacheCartPayload = (state: CartState, payload: MappedCartPayload) => {
  const tabId = payload.nrofor;
  if (tabId == null) return;
  if (!state.cartsById) state.cartsById = {};
  state.cartsById[tabId] = buildCacheEntry(payload);
};

const clearCartStale = (state: CartState, cartId?: number | null) => {
  if (cartId == null || !state.cartStale) return;
  delete state.cartStale[cartId];
};

const markCartStale = (state: CartState, cartId?: number | null) => {
  if (cartId == null) return;
  if (!state.cartStale) state.cartStale = {};
  state.cartStale[cartId] = true;
  if (state.cartsById) {
    delete state.cartsById[cartId];
  }
};

/** Invalida loadFullCart en vuelo del mismo carrito (p.ej. tras add/update/remove). */
const bumpLoadGeneration = (state: CartState, cartId?: number | null): number => {
  if (cartId == null) return 0;
  if (!state.loadGenerationByCartId) state.loadGenerationByCartId = {};
  const next = (state.loadGenerationByCartId[cartId] ?? 0) + 1;
  state.loadGenerationByCartId[cartId] = next;
  return next;
};

const applyBackendCartToState = (state: CartState, payload: MappedCartPayload) => {
  state.nroPool = payload.nroPool;
  state.nrofor = payload.nrofor;
  state.activeCartId = payload.nrofor;
  state.nrocta = payload.nrocta;
  state.nombreCliente = payload.nombreCliente;
  state.titulo = payload.titulo;
  state.notes = payload.notes ?? '';
  state.items = payload.items;
  state.fecha = payload.fecha;
  state.importeContribucionMarginalTotal = payload.importeContribucionMarginalTotal ?? undefined;
  state.porcentajeContribucionMarginalTotal = payload.porcentajeContribucionMarginalTotal ?? undefined;
  state.cdent1 = payload.cdent1 ?? undefined;
  state.direccionEntrega = payload.direccionEntrega ?? undefined;
  state.codigoEntrega = payload.codigoEntrega ?? undefined;
  state.transporteCodigo = payload.transporteCodigo ?? undefined;
  state.transporteNombre = payload.transporteNombre ?? undefined;
  state.transporteCuit = payload.transporteCuit ?? undefined;
  state.transporteDireccion = payload.transporteDireccion ?? undefined;
  state.editable = payload.editable !== false;
  state.cartUsername = payload.username ?? null;

  if (!state.openCarts) state.openCarts = [];
  const tabId = payload.nrofor;
  if (tabId != null) {
    const tab = state.openCarts.find(c => c.id === tabId);
    if (!tab) {
      state.openCarts.push({
        id: tabId,
        titulo: payload.titulo,
        nrofor: payload.nrofor,
        editable: payload.editable !== false,
        username: payload.username ?? undefined,
      });
    } else {
      tab.titulo = payload.titulo;
      tab.nrofor = payload.nrofor;
      tab.editable = payload.editable !== false;
      tab.username = payload.username ?? undefined;
    }
    state.activeCartId = tabId;
  }

  calculateTotals(state);
  cacheCartPayload(state, payload);
  saveCartToStorage(state.activeCartId, state.openCarts);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    cerrarSoloLecturaModal: (state) => {
      state.soloLecturaBloqueado = false;
    },
    setNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload;
    },
    setTitulo: (state, action: PayloadAction<string>) => {
      state.titulo = action.payload;
    },
    clearCheckoutError: (state) => {
      state.checkoutError = null;
    },
    clearCart: (state) => {
      state.items = [];
      state.notes = '';
      state.totalAmount = 0;
      state.totalWeight = 0;
      state.nroPool = undefined;
      state.activeCartId = undefined;
      state.importeContribucionMarginalTotal = undefined;
      state.porcentajeContribucionMarginalTotal = undefined;
      localStorage.removeItem('intercap_cart');
    },
    resetStaffCartWithoutClient: (state) => {
      state.items = [];
      state.notes = '';
      state.totalAmount = 0;
      state.totalWeight = 0;
      state.nroPool = undefined;
      state.nrofor = undefined;
      state.activeCartId = undefined;
      state.openCarts = [];
      state.cartsById = {};
      state.cartStale = {};
      state.loadGenerationByCartId = {};
      state.loadRequestGeneration = {};
      state.nrocta = undefined;
      state.nombreCliente = undefined;
      state.titulo = undefined;
      state.fecha = undefined;
      state.codigoCircuito = undefined;
      state.importeContribucionMarginalTotal = undefined;
      state.porcentajeContribucionMarginalTotal = undefined;
      localStorage.removeItem('intercap_cart');
      localStorage.removeItem('intercap_active_cart');
      saveCartToStorage(undefined, []);
    },
    switchTab: (state, action: PayloadAction<number>) => {
      state.activeCartId = action.payload;
      saveCartToStorage(state.activeCartId, state.openCarts);
    },
    activateCachedCart: (state, action: PayloadAction<number>) => {
      const cached = state.cartsById?.[action.payload];
      if (!cached) {
        state.activeCartId = action.payload;
        saveCartToStorage(state.activeCartId, state.openCarts);
        return;
      }
      const p = cached.payload;
      state.activeCartId = action.payload;
      state.nroPool = p.nroPool;
      state.nrofor = p.nrofor;
      state.nrocta = p.nrocta;
      state.nombreCliente = p.nombreCliente;
      state.titulo = p.titulo;
      state.notes = p.notes ?? '';
      state.items = p.items;
      state.fecha = p.fecha;
      state.importeContribucionMarginalTotal = p.importeContribucionMarginalTotal;
      state.porcentajeContribucionMarginalTotal = p.porcentajeContribucionMarginalTotal;
      state.cdent1 = p.cdent1;
      state.direccionEntrega = p.direccionEntrega;
      state.codigoEntrega = p.codigoEntrega;
      state.transporteCodigo = p.transporteCodigo;
      state.transporteNombre = p.transporteNombre;
      state.transporteCuit = p.transporteCuit;
      state.transporteDireccion = p.transporteDireccion;
      calculateTotals(state);
      saveCartToStorage(state.activeCartId, state.openCarts);
    },
    closeTab: (state, action: PayloadAction<number>) => {
      state.openCarts = state.openCarts?.filter(c => c.id !== action.payload);
      if (state.cartsById) {
        delete state.cartsById[action.payload];
      }
      if (state.cartStale) {
        delete state.cartStale[action.payload];
      }
      if (state.activeCartId === action.payload) {
        state.activeCartId = state.openCarts && state.openCarts.length > 0
          ? state.openCarts[state.openCarts.length - 1].id
          : undefined;
          
        if (!state.activeCartId) {
          state.items = [];
          state.nroPool = undefined;
          state.nrofor = undefined;
          state.titulo = undefined;
          state.notes = '';
          state.totalAmount = 0;
          state.totalWeight = 0;
          state.fecha = undefined;
          state.importeContribucionMarginalTotal = undefined;
          state.porcentajeContribucionMarginalTotal = undefined;
        }
      }
      saveCartToStorage(state.activeCartId, state.openCarts);
    },
    addTab: (state, action: PayloadAction<{ id: number; titulo?: string; nrofor?: number }>) => {
      if (!state.openCarts) state.openCarts = [];
      const exists = state.openCarts.find(c => c.id === action.payload.id);
      if (!exists) {
        state.openCarts.push(action.payload);
      } else {
        exists.titulo = action.payload.titulo;
        if (action.payload.nrofor) exists.nrofor = action.payload.nrofor;
      }
      state.activeCartId = action.payload.id;
      saveCartToStorage(state.activeCartId, state.openCarts);
    },
    hydrateCart: (state, action: PayloadAction<Partial<CartState>>) => {
      const newState = { ...state, ...action.payload, loading: false, error: null };
      return newState;
    },
    rehydrateTabs: (state) => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('intercap_active_cart');
        if (saved) {
          const { activeCartId, openCarts } = JSON.parse(saved);
          state.activeCartId = activeCartId;
          state.openCarts = openCarts;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveCart.fulfilled, (state) => {
        state.loading = false;
        state.switchingCartId = undefined;
      })
      .addCase(fetchActiveCart.rejected, (state) => {
        state.loading = false;
        state.switchingCartId = undefined;
      })
      .addCase(loadFullCart.pending, (state, action) => {
        if (!action.meta.arg.background) {
          state.loading = true;
        }
        const cartId = action.meta.arg.id;
        const gen = bumpLoadGeneration(state, cartId);
        if (!state.loadRequestGeneration) state.loadRequestGeneration = {};
        state.loadRequestGeneration[action.meta.requestId] = { cartId, gen };
        // No pisar switchingCartId de otra solapa con un refresh en vuelo.
        if (
          state.activeCartId === cartId
          || state.switchingCartId == null
          || state.switchingCartId === cartId
        ) {
          state.switchingCartId = cartId;
        }
      })
      .addCase(loadFullCart.fulfilled, (state, action) => {
        const loadedId = action.meta.arg.id;
        if (!action.meta.arg.background) {
          state.loading = false;
        }
        if (state.switchingCartId === loadedId) {
          state.switchingCartId = undefined;
        }
        const tracked = state.loadRequestGeneration?.[action.meta.requestId];
        if (state.loadRequestGeneration) {
          delete state.loadRequestGeneration[action.meta.requestId];
        }
        const currentGen = state.loadGenerationByCartId?.[loadedId];
        const isStaleLoad =
          !tracked
          || tracked.cartId !== loadedId
          || currentGen == null
          || tracked.gen !== currentGen;

        if (action.meta.arg.refresh && !isStaleLoad) {
          clearCartStale(state, loadedId);
        }
        // Descartar snapshot viejo del mismo carrito (p.ej. ensureCartFresh previo a un add).
        // Tampoco cachearlo: pisaría la versión vigente con precios viejos.
        if (isStaleLoad) {
          return;
        }
        cacheCartPayload(state, action.payload);
        // Evita que una respuesta vieja de otro carrito vuelva a activar esa solapa.
        if (state.activeCartId === loadedId) {
          applyBackendCartToState(state, action.payload);
        } else if (action.payload.nrofor != null && state.openCarts) {
          const tab = state.openCarts.find((c) => c.id === action.payload.nrofor);
          if (tab) {
            tab.titulo = action.payload.titulo;
            tab.nrofor = action.payload.nrofor;
          }
        }
      })
      .addCase(switchCartTab.pending, (state, action) => {
        state.switchingCartId = action.meta.arg.id;
      })
      .addCase(switchCartTab.fulfilled, (state) => {
        state.switchingCartId = undefined;
      })
      .addCase(switchCartTab.rejected, (state) => {
        state.switchingCartId = undefined;
      })
      .addCase(updateItemBackend.fulfilled, (state, action) => {
        if (action.payload?.id) {
          bumpLoadGeneration(state, action.meta.arg.cartId);
          markCartStale(state, action.meta.arg.cartId);
          const mapped = mapBackendCartResponse(action.payload);
          if (state.activeCartId === action.meta.arg.cartId) {
            applyBackendCartToState(state, mapped);
          } else {
            cacheCartPayload(state, mapped);
          }
        }
      })
      .addCase(removeItemFromBackend.fulfilled, (state, action) => {
        if (action.payload?.id) {
          bumpLoadGeneration(state, action.meta.arg.cartId);
          markCartStale(state, action.meta.arg.cartId);
          const mapped = mapBackendCartResponse(action.payload);
          if (state.activeCartId === action.meta.arg.cartId) {
            applyBackendCartToState(state, mapped);
          } else {
            cacheCartPayload(state, mapped);
          }
        }
      })
      .addCase(addItemToBackend.rejected, (state, action) => {
        if ((action.payload as { code?: string } | undefined)?.code === cartService.CART_READONLY_CODE) {
          state.soloLecturaBloqueado = true;
        }
      })
      .addCase(addItemToBackend.fulfilled, (state, action) => {
        if (action.payload?.id) {
          const mapped = mapBackendCartResponse(action.payload);
          const destId = mapped.nrofor ?? action.meta.arg.cartId;
          bumpLoadGeneration(state, destId);
          bumpLoadGeneration(state, action.meta.arg.cartId);
          markCartStale(state, action.meta.arg.cartId);
          // Siempre activar el carrito que recibió el ítem (evita UI vacía hasta click).
          applyBackendCartToState(state, mapped);
        }
      })
      .addCase(importCartItemsBackend.fulfilled, (state, action) => {
        const cart = action.payload?.cart;
        if (!cart) return;
        const cartId =
          cart.id?.nrofor ??
          (typeof cart.id === 'number' ? cart.id : undefined) ??
          cart.nrofor ??
          action.meta.arg.cartId;
        if (cartId == null) return;
        bumpLoadGeneration(state, cartId);
        bumpLoadGeneration(state, action.meta.arg.cartId);
        markCartStale(state, action.meta.arg.cartId);
        const mapped = mapBackendCartResponse(cart);
        applyBackendCartToState(state, mapped);
      })
      .addCase(loadFullCart.rejected, (state, action) => {
        const loadedId = action.meta.arg.id;
        if (!action.meta.arg.background) {
          state.loading = false;
        }
        if (state.switchingCartId === loadedId) {
          state.switchingCartId = undefined;
        }
        if (state.loadRequestGeneration) {
          delete state.loadRequestGeneration[action.meta.requestId];
        }
      })
      .addCase(fetchCarts.fulfilled, (state, action) => {
        const carts = action.payload;
        state.openCarts = carts.map((c: any) => ({
          id: c.id,
          nrofor: c.nrofor,
          titulo: c.titulo || (c.nombreCliente ? `Pedido: ${c.nombreCliente}` : `Pedido #${c.id}`),
          editable: c.editable !== false,
          username: c.username ?? undefined,
        }));
        const open = state.openCarts ?? [];
        const activeTab = open.find((c) => c.id === state.activeCartId);
        // Solo mantener activo si es propio (editable). Nunca default a solo-lectura.
        const stillValid = activeTab != null && activeTab.editable !== false;
        if (!stillValid) {
          // Primer propio (lista staff: OrderByFechaModificacionDesc).
          state.activeCartId = open.find((c) => c.editable)?.id;
          if (state.activeCartId == null) {
            state.items = [];
            state.nrofor = undefined;
            state.titulo = undefined;
            state.notes = '';
            state.totalAmount = 0;
            state.totalWeight = 0;
          } else {
            // Forzar carga del detalle en el microtask de fetchCarts.
            markCartStale(state, state.activeCartId);
            state.nrofor = undefined;
            state.items = [];
          }
          saveCartToStorage(state.activeCartId, state.openCarts);
        }
      })
      .addCase(updateCartBackend.fulfilled, (state, action) => {
        if (action.payload) {
          const mapped = mapBackendCartResponse(action.payload);
          const destId = mapped.nrofor ?? action.meta.arg.cartId;
          // Solo aplicar al UI si es el carrito activo (auto-save de otra solapa no pisa).
          if (state.activeCartId === action.meta.arg.cartId || state.activeCartId === destId) {
            applyBackendCartToState(state, mapped);
          } else {
            cacheCartPayload(state, mapped);
          }
          return;
        }
        if (action.meta.arg.updates.titulo !== undefined) {
          state.titulo = action.meta.arg.updates.titulo;
          const tab = state.openCarts?.find(c => c.id === action.meta.arg.cartId);
          if (tab) tab.titulo = action.meta.arg.updates.titulo;
        }
        if (action.meta.arg.updates.observaciones !== undefined) {
          state.notes = action.meta.arg.updates.observaciones;
        }
        if (action.meta.arg.updates.notes !== undefined) {
          state.notes = action.meta.arg.updates.notes;
        }
        const cartId = action.meta.arg.cartId;
        if (cartId && state.cartsById?.[cartId]) {
          const entry = state.cartsById[cartId];
          if (action.meta.arg.updates.titulo !== undefined) {
            entry.payload.titulo = action.meta.arg.updates.titulo;
          }
          if (action.meta.arg.updates.observaciones !== undefined) {
            entry.payload.notes = action.meta.arg.updates.observaciones;
          }
          if (action.meta.arg.updates.notes !== undefined) {
            entry.payload.notes = action.meta.arg.updates.notes;
          }
        }
      })
      .addCase(checkoutCart.pending, (state) => {
        state.loading = true;
        state.checkoutError = null;
      })
      .addCase(checkoutCart.fulfilled, (state, action) => {
        state.loading = false;
        state.checkoutError = null;
        const { checkoutCartId, nextCartId } = action.payload;
        state.openCarts = state.openCarts?.filter(c => c.id !== checkoutCartId);
        if (state.cartsById) {
          delete state.cartsById[checkoutCartId];
        }
        if (state.cartStale) {
          delete state.cartStale[checkoutCartId];
        }

        if (state.activeCartId === checkoutCartId) {
          state.activeCartId = nextCartId;
          if (!nextCartId) {
            state.items = [];
            state.nroPool = undefined;
            state.nrofor = undefined;
            state.titulo = undefined;
            state.notes = '';
            state.totalAmount = 0;
            state.totalWeight = 0;
            state.fecha = undefined;
            state.importeContribucionMarginalTotal = undefined;
            state.porcentajeContribucionMarginalTotal = undefined;
            localStorage.removeItem('intercap_cart');
          }
        }
      })
      .addCase(checkoutCart.rejected, (state, action) => {
        state.loading = false;
        state.checkoutError = extractErrorMessage(action.payload, 'Error al confirmar el pedido');
      })
      .addCase(deleteCartBackend.fulfilled, (state, action) => {
        const { deletedId, nextCartId } = action.payload;
        state.openCarts = state.openCarts?.filter(c => c.id !== deletedId);
        if (state.cartsById) {
          delete state.cartsById[deletedId];
        }
        if (state.cartStale) {
          delete state.cartStale[deletedId];
        }
        
        if (state.activeCartId === deletedId) {
          state.activeCartId = nextCartId;
          if (!nextCartId) {
            state.items = [];
            state.nroPool = undefined;
            state.nrofor = undefined;
            state.titulo = undefined;
            state.notes = '';
            state.totalAmount = 0;
            state.totalWeight = 0;
            state.fecha = undefined;
            state.importeContribucionMarginalTotal = undefined;
            state.porcentajeContribucionMarginalTotal = undefined;
            localStorage.removeItem('intercap_cart');
          }
        }
      })
      .addCase('auth/logout', (state) => {
        state.items = [];
        state.notes = '';
        state.totalAmount = 0;
        state.totalWeight = 0;
        state.nroPool = undefined;
        state.importeContribucionMarginalTotal = undefined;
        state.porcentajeContribucionMarginalTotal = undefined;
        state.cartsById = {};
        state.cartStale = {};
        localStorage.removeItem('intercap_cart');
      });
  }
});

export const {
  cerrarSoloLecturaModal,
  setNotes,
  setTitulo,
  clearCheckoutError,
  clearCart,
  resetStaffCartWithoutClient,
  hydrateCart,
  switchTab,
  activateCachedCart,
  closeTab,
  addTab,
  rehydrateTabs,
} = cartSlice.actions;
export default cartSlice.reducer;
