import { ProductUI } from "../models/ProductUI";

export interface CartItem extends ProductUI {
    itemId: number;
    quantity: number;
    subtotal: number;
    weightTotal: number;
    bonificacion1: number | null; // Representado por 'bonificacion' en la base de datos
    bonificacion2: number | null;
    contribucionMarginal?: number;
    totalLinea?: number;
    precioVentaNeto?: number;
    precioFinalPeso: number | null;
    precioUnitario?: number;
    /** Precio unitario c/IVA antes del descuento de oferta (respuesta carrito). */
    precioSinOferta?: number | null;
    porcentajeDescuentoOferta?: number | null;
    /** Pool de venta especial (USR_FCRMVI_NROVES) cuando aplica oferta. */
    nroVentaEspecial?: number | null;
    /** Advertencia si la cantidad supera el stock de oferta disponible. */
    advertenciaStockOferta?: string | null;
    /** Stock vendible actual del pool (CNTDIS − CNTRES − CNTCON). */
    stockOfertaDisponible?: number | null;
    /** Vigencia de la oferta para cuenta regresiva en carrito. */
    ofertaDisdes?: string | null;
    ofertaDishas?: string | null;
    cuentaRegresiva?: boolean | null;
    descripcionPoolOferta?: string | null;
}

export interface CartState {
    /** true = se intentó agregar a un carrito de solo lectura → modal */
    soloLecturaBloqueado?: boolean;
    items: CartItem[];
    notes: string;
    totalAmount: number;
    totalWeight: number;
    loading: boolean;
    error: string | null;
    /** Último error al confirmar pedido (mensaje del backend). */
    checkoutError: string | null;
    nroPool?: number; // Nro de pedido actual (web)
    nrofor?: number;  // Nro de pedido ERP (legacy)
    nrocta?: string;
    nombreCliente?: string;
    titulo?: string;
    fecha?: string;
    codigoCircuito?: string;
    /** Σ margen (ARS), legacy importeContribucionMarginalTotal */
    importeContribucionMarginalTotal?: number | null;
    /** % margen sobre total neto, legacy porcentajeContribucionMarginalTotal (0–100) */
    porcentajeContribucionMarginalTotal?: number | null;

    /** Código de dirección de entrega (VTTENT_CDENTR); "99" = retiro en depósito. */
    cdent1?: string | null;
    direccionEntrega?: string | null;
    codigoEntrega?: string | null;
    transporteCodigo?: string | null;
    transporteNombre?: string | null;
    transporteCuit?: string | null;
    transporteDireccion?: string | null;

    /** false = staff viendo carrito ajeno del cliente (solo lectura). */
    editable?: boolean;
    /** Owner Softland del carrito (FCRMVH_USERID). */
    cartUsername?: string | null;

    // Soporte para múltiples pestañas
    openCarts?: { id: number; titulo?: string; nrofor?: number; editable?: boolean; username?: string }[]; 
    activeCartId?: number; // ID del carrito actualmente activo
    /** Cache en memoria por id de pedido (cambio de pestaña). */
    cartsById?: Record<number, { payload: Omit<CartState, 'cartsById' | 'switchingCartId' | 'loading' | 'error' | 'checkoutError'> & { items: CartItem[] }; fetchedAt: number }>;
    /** Pestaña en curso de carga remota. */
    switchingCartId?: number;
    /** Carritos que necesitan refresh=true en la próxima carga (tras mutación). */
    cartStale?: Record<number, boolean>;
    /**
     * Generation por cartId: sube en cada loadFullCart.pending y en mutaciones.
     * Permite descartar respuestas stale del mismo carrito.
     */
    loadGenerationByCartId?: Record<number, number>;
    /** Generation que posee cada requestId de loadFullCart en vuelo. */
    loadRequestGeneration?: Record<string, { cartId: number; gen: number }>;
}
