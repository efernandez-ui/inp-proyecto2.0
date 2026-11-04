import { AplicacionDTO, StockDTO } from "@/interfaces/producto"

export interface ImageItem {
    pathImagenChica?: string
    pathImagenGrande?: string
}

export interface PoolUI {
    nroPool: number
    precio: number
    precioLista: number
    precioConIVA: number
    stock: number
}

export interface PresentacionUI {
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

export interface ProductUI {
    // Campos básicos
    tippro: string
    artcod: string
    descripcion: string
    importado: boolean
    moneda: string
    images: (string | ImageItem)[]

    // Stocks de CATALOGO_TV
    stockNoa: number | null
    stockNea: number | null
    stockBue: number | null
    stockCuy: number | null
    stockTotal: number | null

    // Stocks mínimos
    stockMin: number | null
    stockMin20: number | null
    stockMin30: number | null
    stockMin40: number | null
    stockMin50: number | null

    // Precios
    price: number
    listPrice?: number
    precioReposicion?: number
    precioReferencia: number | null
    precioCosto: number | null
    precioFinalDolar: number | null
    precioFinalPeso: number | null
    precioMarcado: number | null

    // Stock del pool activo
    stockDisponible: number

    // Otros atributos
    tipo: string | null
    subtipo: string | null
    marca: string | null
    nroParte?: string
    peso: number | null
    nuevo: string | null
    productoAPedido: string | null
    /** ITEM_CATALOGO.PROXIMO_INGRESO */
    proximoIngreso?: string | null
    unidadMedidaCatalogo?: string | null

    // Atributos de bonificación
    bonificacion: number | null
    bonificacion2: number | null
    precioBonificado: number | null

    enOferta?: string | null
    itemProductoVentaEspeciales?: import('@/interfaces/producto').ProductoVentaEspecial[]

    // Cotización USD (para conversión en el frontend)
    cotizacionUSD: number | null

    stock?: StockDTO[]
    pools: PoolUI[]

    // Campos de presentaciones y atributos
    presentaciones?: PresentacionUI[]
    aplicaciones?: AplicacionDTO[]
    atributos?: Record<string, string>

    // Flags de existencia (para habilitar/deshabilitar botones sin fetch previo)
    tieneVideo?: string
    tieneSustitutos?: string
    tieneRelacionados?: string
    tieneAplicaciones?: string
}
