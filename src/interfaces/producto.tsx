export interface Unidad {
    unidad: string
    descripcion: string
}

export interface ProductoBase {
    tippro: string
    artcod: string
    descripcion: string
    nroParte: string
    importado: 'S' | 'N' | boolean
    precioReposicion: number
    moneda: string
    precioUltimaCompra: number
    monedaUltimaCompra: string
    unidadMedida: Unidad
    unidadConversion: Unidad
    factorConvesion: number
    proveedorID: string
    estado: string
    agrupacionCostos: string | null
    fechaModificacion: string
    modcpt: string
    tipcpt: string
    codcpt: string
    cuenvt: string
}

export interface ProductoVentaEspecial {
    nroPool: number
    orden: number
    precioCosto?: number
    precioNormal?: number
    precioNormalConIVA?: number
    porcentajeDescuento?: number
    precioVE?: number
    precioConIVA?: number
    cantidadTotal?: number
    cantidadDisponible: number
    tipfin?: string | null
    tipoOferta?: string | null
    descripcionPool?: string | null
    ofertaDisdes?: string | null
    ofertaDishas?: string | null
    cierrePorStock?: boolean
    cuentaRegresiva?: boolean
}

export interface ItemPicking { }

export interface StockDTO {
    sucursal: string
    cantidad: number
    stockMinimo: number
    estado: string
}

export interface ImagenUrlDTO {
    pathImagenChica: string | null
    pathImagenGrande: string | null
}

export interface PoolDTO {
    nroPool: number
    precio: number
    precioLista: number
    precioConIVA: number
    stock: number
}

export interface PresentacionDTO {
    tipoEnvase: number
    cantidad: number | null
    codigoBarra: string | null
    alto: number | null
    ancho: number | null
    peso: number | null
    profundidad: number | null
    unidadMedida: string | null
    unidadMedidaDescrp?: string | null
    unidadPeso: string | null
}

/** Referencias de video del producto (si el backend las expone en /full). */
export interface ProductoVideoRef {
    url?: string | null
    path?: string | null
    thumbnailUrl?: string | null
    poster?: string | null
}

export interface AplicacionDTO {
    marca: string | null
    modelo: string | null
    version: string | null
    cilindrada: string | null
    tipoMotor: string | null
    adesde: string | null
    ahasta: string | null
    annios: string | null
}

export interface ProductoDTO extends ProductoBase {
    // Stocks de ITEM_CATALOGO
    stockNoa: number | null
    stockNea: number | null
    stockBue: number | null
    stockCuy: number | null
    stockTotal: number | null

    // Stocks mínimos de ITEM_CATALOGO
    stockMin: number | null
    stockMin20: number | null
    stockMin30: number | null
    stockMin40: number | null
    stockMin50: number | null

    // Precios de ITEM_CATALOGO
    precioReferencia: number | null
    precioCosto: number | null
    iva?: number | null
    precioFinalDolar: number | null
    precioFinalPeso: number | null
    precioMarcado: number | null

    // Otros atributos de ITEM_CATALOGO
    tipo: string | null
    subtipo: string | null
    marca: string | null
    codigoLista: string | null
    unidadMedidaCatalogo: string | null
    unidadConversionCatalogo: string | null
    factorConversion: number | null
    peso: number | null
    nuevo: string | null
    productoAPedido: string | null
    /** ITEM_CATALOGO.PROXIMO_INGRESO */
    proximoIngreso?: string | null
    disponibleEnInternet: string | null
    activo: string | null

    // Atributos de bonificación
    bonificacion: number | null
    bonificacion2: number | null
    precioBonificado: number | null

    stock: StockDTO[]
    itemPickings: ItemPicking[]
    itemProductoVentaEspeciales: ProductoVentaEspecial[]

    // Frontend specific or mapped fields (check usage)
    imgchi?: string | null
    imggra?: string | null
    imagenes?: ImagenUrlDTO[] // Assuming backend might send this if populated, or we fetch separately

    // Legacy fields that might be used in frontend logic but not in backend DTO directly
    // (Add them as optional if needed or remove if unused)
    enOferta?: string
    tieneVideo?: string
    tieneAplicaciones?: string
    tieneSustitutos?: string
    tieneRelacionados?: string
    precioLista?: number // Backend has precioReposicion, but DTO logic uses precioLista from Catalogo
    precioFinal?: number // Backend has precioFinalPeso/Dolar

    // Campos de presentaciones y atributos
    presentaciones?: PresentacionDTO[]
    /** URLs o objetos con url/path; se muestran al final de la galería en el detalle. */
    videos?: ProductoVideoRef[] | string[]
    aplicaciones?: AplicacionDTO[]
    atributos?: Record<string, string>

    // Campos adicionales del endpoint full
    rubro?: string | null
    idrub?: string | null
    preven?: number | null
    premay?: number | null
    precom?: number | null

    // Cotización USD (para conversión en el frontend)
    cotizacionUSD?: number | null
}
