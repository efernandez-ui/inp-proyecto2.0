import { CartItem } from '../interfaces/cart';

export type MappedCartPayload = {
  nroPool: number | undefined;
  nrofor: number | undefined;
  nrocta: string | undefined;
  nombreCliente: string | undefined;
  titulo: string | undefined;
  notes: string | undefined;
  items: CartItem[];
  fecha: string | undefined;
  codigoCircuito: string | undefined;
  importeContribucionMarginalTotal: number | null;
  porcentajeContribucionMarginalTotal: number | null;
  cdent1?: string | null;
  direccionEntrega?: string | null;
  codigoEntrega?: string | null;
  transporteCodigo?: string | null;
  transporteNombre?: string | null;
  transporteCuit?: string | null;
  transporteDireccion?: string | null;
  /** false = solo lectura (carrito de otro usuario en cartera). */
  editable?: boolean;
  username?: string | null;
};

/** Mapea la respuesta JSON del backend (GET/PUT/POST carrito) al shape usado en Redux. */
export function mapBackendCartResponse(backendCart: any): MappedCartPayload {
  const enrichedItems = (backendCart.items || []).map((item: any) => ({
    tippro: item.tippro,
    artcod: item.artcod,
    descripcion: item.descripcion,
    marca: item.marca,
    peso: item.peso,
    images: item.imagenUrl ? [item.imagenUrl] : [],
    itemId: item.itemId || item.id?.nroitm,
    quantity: item.cantidad,
    subtotal: item.totalLinea,
    totalLinea: item.totalLinea,
    precioUnitario: item.precioUnitario,
    precioVentaNeto: item.precioVentaNeto,
    precioFinalPeso: item.precioFinalPeso,
    precioSinOferta: item.precioSinOferta,
    enOferta: item.enOferta,
    nroVentaEspecial: item.nroVentaEspecial,
    porcentajeDescuentoOferta: item.porcentajeDescuentoOferta,
    advertenciaStockOferta: item.advertenciaStockOferta ?? undefined,
    stockOfertaDisponible: item.stockOfertaDisponible ?? undefined,
    ofertaDisdes: item.ofertaDisdes ?? undefined,
    ofertaDishas: item.ofertaDishas ?? undefined,
    cuentaRegresiva: item.cuentaRegresiva ?? undefined,
    descripcionPoolOferta: item.descripcionPoolOferta ?? undefined,
    itemProductoVentaEspeciales:
      item.enOferta === 'S' && item.porcentajeDescuentoOferta != null
        ? [{
            nroPool: item.nroVentaEspecial ?? 0,
            orden: 1,
            porcentajeDescuento: item.porcentajeDescuentoOferta,
            cantidadDisponible: item.stockOfertaDisponible != null
              ? Number(item.stockOfertaDisponible)
              : 0,
            ofertaDisdes: item.ofertaDisdes ?? null,
            ofertaDishas: item.ofertaDishas ?? null,
            cuentaRegresiva: item.cuentaRegresiva === true,
            descripcionPool: item.descripcionPoolOferta ?? null,
          }]
        : undefined,
    weightTotal: item.cantidad * (item.peso || 0),
    bonificacion1: item.bonificacion,
    bonificacion2: item.bonificacion2,
    contribucionMarginal: item.contribucionMarginal,
  } as unknown as CartItem));

  return {
    nroPool: backendCart.nrpool,
    nrofor: backendCart.id?.nrofor ?? backendCart.id ?? backendCart.nrofor,
    nrocta: backendCart.nrocta,
    nombreCliente: backendCart.nombreCliente,
    titulo: backendCart.titulo,
    notes: backendCart.observaciones,
    items: enrichedItems.filter((item: CartItem | null) => item !== null) as CartItem[],
    fecha: backendCart.fechaCreacion,
    codigoCircuito: backendCart.codigoCircuito,
    importeContribucionMarginalTotal: backendCart.importeContribucionMarginalTotal ?? null,
    porcentajeContribucionMarginalTotal: backendCart.porcentajeContribucionMarginalTotal ?? null,
    cdent1: backendCart.cdent1 ?? null,
    direccionEntrega: backendCart.direccionEntrega ?? null,
    codigoEntrega: backendCart.codigoEntrega ?? null,
    transporteCodigo: backendCart.transporteCodigo ?? null,
    transporteNombre: backendCart.transporteNombre ?? null,
    transporteCuit: backendCart.transporteCuit ?? null,
    transporteDireccion: backendCart.transporteDireccion ?? null,
    editable: backendCart.editable !== false,
    username: backendCart.username ?? null,
  };
}
