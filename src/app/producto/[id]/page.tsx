'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getProductById, fetchSustitutos, fetchRelacionados } from '@/services/products'
import { ProductoDTO, AplicacionDTO, ImagenUrlDTO } from '@/interfaces/producto'
import ProductGalleryModal from '@/components/catalog/ProductGalleryModal'
import ProductPools from '@/components/catalog/ProductPools'
import AplicacionesMotocicletaModal from '@/components/catalog/AplicacionesMotocicletaModal'
import ProductVinculadosGrid from '@/components/catalog/ProductVinculadosGrid'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store'
import { useCurrency } from '@/hooks/useCurrencyPreference'
import { useCatalogUI } from '@/context/CatalogUIContext'
import { addItemToBackend, fetchActiveCart, removeItemFromBackend } from '@/store/cartSlice'
import { useSyncedCartQuantity } from '@/hooks/useSyncedCartQuantity'
import { useSyncedBonif2FromCart } from '@/hooks/useSyncedBonif2FromCart'
import { favoriteKey, setFavoriteLocal, toggleFavorite } from '@/store/favoritesSlice'
import { ProductUI } from '@/models/ProductUI'
import { unidadPresentacionLabel, pesoPresentacionLabel } from '@/utils/productPresentacionLabels'
import { toast } from 'react-toastify'
import { ArrowLeft, ArrowRight, Bike, Calculator, Heart, Link2, Loader2, Play, RotateCcw, Search, ShoppingCart, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import OfertaPrecioDisplay from '@/components/catalog/OfertaPrecioDisplay'
import DescuentoCornerBadges from '@/components/catalog/DescuentoCornerBadges'
import NuevoProductBadge from '@/components/catalog/NuevoProductBadge'
import { resolveOfertaPrecios, debeMostrarPrecioPromocional } from '@/utils/ofertaPrecios'
import { resolvePreciosMoneda, calcularPrecioPublico, tienePrecioListaVisible } from '@/utils/productoPrecios'
import { isProductoNuevo } from '@/utils/productoNuevo'
import { isValidProductImageUrl, PRODUCT_PLACEHOLDER, PRODUCT_PLACEHOLDER_SMALL } from '@/utils/productImage'
import BranchStockDisplay from '@/components/catalog/BranchStockDisplay'
import Modal from '@/components/modals/Modal'
import { CART_READONLY_CODE } from '@/services/cart'

type VideoSlide = { url: string; poster?: string }

function youtubeThumbnail(url: string): string | undefined {
    try {
        const parsed = new URL(url)
        const host = parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, '')
        let id: string | undefined
        if (host === 'youtu.be') {
            id = parsed.pathname.split('/')[1]
        } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
            const segments = parsed.pathname.split('/').filter(Boolean)
            id = segments[0] === 'watch'
                ? parsed.searchParams.get('v') || undefined
                : ['embed', 'shorts', 'live', 'v'].includes(segments[0]) ? segments[1] : undefined
        }
        return id && /^[\w-]{11}$/.test(id)
            ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
            : undefined
    } catch {
        return undefined
    }
}

function buildVideoSlides(product: ProductoDTO): VideoSlide[] {
    const raw = product.videos
    if (!Array.isArray(raw)) return []
    const out: VideoSlide[] = []
    for (const item of raw) {
        if (typeof item === 'string') {
            const u = item.trim()
            if (u) out.push({ url: u, poster: youtubeThumbnail(u) })
        } else if (item && typeof item === 'object') {
            const o = item as Record<string, string | null | undefined>
            const url = String(o.url || o.path || '').trim()
            if (url) {
                const posterRaw = o.thumbnailUrl || o.poster
                const poster = youtubeThumbnail(url) || (typeof posterRaw === 'string' && posterRaw.trim() ? posterRaw.trim() : undefined)
                out.push({ url, poster })
            }
        }
    }
    return out
}

type MediaSlide =
    | { kind: 'image'; imageIndex: number }
    | { kind: 'video'; url: string; poster?: string }

function normalizeTextValue(value: unknown): string {
    if (value == null) return ''
    return String(value).trim()
}

function normalizeNullableText(value: unknown): string | null {
    const normalized = normalizeTextValue(value)
    return normalized.length > 0 ? normalized : null
}

/** Nombre del atributo como en USR_PRATRI (mayúsculas, acentos y unidades), solo cambia "_" por espacio. */
function formatAttributeLabel(key: string): string {
    return key.replace(/_+/g, ' ').trim()
}

type ApplicationRow = {
    app: AplicacionDTO
    marcaSpan: number
    modeloSpan: number
    cilindradaSpan: number
}

function buildApplicationRows(applications: AplicacionDTO[]): ApplicationRow[] {
    const sorted = [...applications].sort((a, b) =>
        (a.marca ?? '').localeCompare(b.marca ?? '', 'es') ||
        (a.modelo ?? '').localeCompare(b.modelo ?? '', 'es') ||
        (a.cilindrada ?? '').localeCompare(b.cilindrada ?? '', 'es', { numeric: true }) ||
        (a.version ?? '').localeCompare(b.version ?? '', 'es')
    )
    const rows = sorted.map((app) => ({ app, marcaSpan: 0, modeloSpan: 0, cilindradaSpan: 0 }))

    for (let marcaStart = 0; marcaStart < sorted.length;) {
        let marcaEnd = marcaStart + 1
        while (marcaEnd < sorted.length && sorted[marcaEnd].marca === sorted[marcaStart].marca) marcaEnd++
        rows[marcaStart].marcaSpan = marcaEnd - marcaStart

        for (let modeloStart = marcaStart; modeloStart < marcaEnd;) {
            let modeloEnd = modeloStart + 1
            while (modeloEnd < marcaEnd && sorted[modeloEnd].modelo === sorted[modeloStart].modelo) modeloEnd++
            rows[modeloStart].modeloSpan = modeloEnd - modeloStart

            for (let ccStart = modeloStart; ccStart < modeloEnd;) {
                let ccEnd = ccStart + 1
                while (ccEnd < modeloEnd && sorted[ccEnd].cilindrada === sorted[ccStart].cilindrada) ccEnd++
                rows[ccStart].cilindradaSpan = ccEnd - ccStart
                ccStart = ccEnd
            }
            modeloStart = modeloEnd
        }
        marcaStart = marcaEnd
    }

    return rows
}

function ProductInfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[100px_minmax(0,1fr)] border-b border-gray-100 py-2 last:border-b-0">
            <span className="min-w-0 [overflow-wrap:anywhere] text-[11px] font-medium uppercase leading-4 tracking-wide text-slate-400">{label}:</span>
            <span className="min-w-0 break-words pl-2 text-xs leading-4 text-slate-900">{value}</span>
        </div>
    )
}

function isYoutubeEmbedUrl(url: string | undefined): boolean {
    if (!url) return false
    const normalized = url.trim().toLowerCase()
    return normalized.includes('youtube.com/embed/') || normalized.includes('youtu.be/')
}

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { id } = params as { id: string }
    const urlNrocta = searchParams?.get('nrocta')

    // Parse tippro and artcod from URL (new format: tipproartcod without dash, e.g., 001001010031)
    // For backward compatibility, also support old format: tippro-artcod (e.g., 001-001010031)
    const parseId = (id: string): [string, string] => {
        if (!id) return ['', ''];

        // Try new format first: first 3 chars = tippro, rest = artcod
        if (id.length >= 3) {
            const tippro = id.substring(0, 3);
            const artcod = id.substring(3);
            if (artcod.length > 0) {
                return [tippro, artcod];
            }
        }

        // Fallback to old format: split by dash
        const parts = id.split('-');
        if (parts.length >= 2) {
            return [parts[0], parts.slice(1).join('')];
        }

        return ['', id];
    };

    const [tippro, artcod] = parseId(id || '')

    const [product, setProduct] = useState<ProductoDTO | null>(null)
    const [fetchedImages, setFetchedImages] = useState<{ key: string; images: (ImagenUrlDTO | string)[] } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showGallery, setShowGallery] = useState(false)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const [aplicacionesQuery, setAplicacionesQuery] = useState('')
    const [sustitutos, setSustitutos] = useState<ProductoDTO[]>([])
    const [relacionados, setRelacionados] = useState<ProductoDTO[]>([])

    const { isLoggedIn, selectedClient, user } = useSelector((state: RootState) => state.auth)
    const { activeCartId, loading: cartLoading, items: cartItems } = useSelector((state: RootState) => state.cart)
    const favoritesKeys = useSelector((state: RootState) => state.favorites.keys)
    const dispatch = useDispatch<AppDispatch>()
    const { currency, setCurrency } = useCurrency()
    const { markupPercentage, showPurchasePrice, showPublicPrice, togglePurchasePrice, togglePublicPrice, setMarkupPercentage } = useCatalogUI()
    const [isAdding, setIsAdding] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [aplicacionesModalOpen, setAplicacionesModalOpen] = useState(false)
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
    const [showMarkupWarning, setShowMarkupWarning] = useState(false)

    // Verificar si el producto ya está en el carrito
    const cartItem = cartItems.find(item =>
        item.tippro.trim() === (tippro || '').trim() &&
        item.artcod.trim() === (artcod || '').trim()
    )
    const isInCart = !!cartItem

    const productKey = product
        ? `${(product.tippro || '').trim()}-${(product.artcod || '').trim()}`
        : ''
    const { bonif2, setBonif2FromUi, isUpdatingBonif2 } = useSyncedBonif2FromCart({
        isInCart,
        cartBonificacion2: cartItem?.bonificacion2,
        cartItemId: cartItem?.itemId,
        activeCartId: activeCartId ?? undefined,
        catalogBonificacion2: product?.bonificacion2 ?? null,
        productKey,
    })

    const { quantity, setQuantityFromUi, isUpdatingQty } = useSyncedCartQuantity({
        isInCart,
        cartItemId: cartItem?.itemId,
        cartQuantity: cartItem?.quantity,
        activeCartId: activeCartId ?? undefined,
    })

    const favKey = favoriteKey(tippro || '', artcod || '')
    const isFav = !!favoritesKeys[favKey]
    const handleToggleFavorite = async () => {
        if (!isLoggedIn) {
            toast.info('Iniciá sesión para agregar a favoritos')
            return
        }
        const token = localStorage.getItem('authToken')
        if (!token) {
            toast.error('La sesión ha expirado')
            return
        }
        const nextIsFavorite = !isFav
        dispatch(setFavoriteLocal({ key: favKey, isFavorite: nextIsFavorite }))
        try {
            await dispatch(toggleFavorite({ token, tippro: tippro || '', artcod: artcod || '', nextIsFavorite })).unwrap()
            toast.success(nextIsFavorite ? 'Producto agregado a favoritos' : 'Producto eliminado de favoritos')
        } catch {
            dispatch(setFavoriteLocal({ key: favKey, isFavorite: isFav }))
            toast.error('No se pudo actualizar favoritos')
        }
    }

    const handleAddToCart = async () => {
        const token = localStorage.getItem('authToken')
        if (!isLoggedIn || !token) {
            toast.error('Debe iniciar sesión para agregar al carrito')
            return
        }

        if (!product) return

        // Validar que el vendedor/admin haya seleccionado un cliente
        const isStaff = user?.tipo === 'V' || user?.tipo === 'A' || user?.tipo === 'S' || user?.tipo === 'B'
        if (isStaff && !selectedClient) {
            toast.warning('Debe seleccionar un cliente antes de agregar productos', {
                position: "top-center",
                theme: "colored"
            })
            return
        }

        setIsAdding(true)
        try {
            let currentCartId = activeCartId

            if (!currentCartId) {
                const activeCart = await dispatch(fetchActiveCart({
                    token,
                    nrocta: selectedClient?.nrocta
                })).unwrap()
                currentCartId = activeCart?.nrofor
            }

            if (currentCartId) {
                // Mapear ProductoDTO a ProductUI para el thunk
                const productUI: ProductUI = {
                    ...product as any,
                    tippro: product.tippro || '',
                    artcod: product.artcod || '',
                    descripcion: product.descripcion || '',
                    images: product.imagenes || []
                }

                await dispatch(addItemToBackend({
                    cartId: currentCartId,
                    product: productUI,
                    quantity,
                    token,
                    nrocta: selectedClient?.nrocta,
                    bonificacion2: (user?.tipo === 'V' || user?.tipo === 'A' || user?.tipo === 'S' || user?.tipo === 'B') && bonif2 !== 0
                        ? -Math.abs(bonif2)
                        : undefined
                })).unwrap()
                toast.success(`${product.descripcion} agregado al carrito`, {
                    position: "bottom-right",
                    autoClose: 2000,
                    theme: "colored",
                })
            }
        } catch (error) {
            if ((error as { code?: string } | null)?.code === CART_READONLY_CODE) return // ya se muestra el modal
            toast.error('Error al agregar el producto al carrito')
            console.error(error)
        } finally {
            setIsAdding(false)
        }
    }

    const handleRemoveFromCart = async () => {
        const token = localStorage.getItem('authToken')
        if (!token || !cartItem?.itemId) return

        setIsRemoving(true)
        try {
            await dispatch(removeItemFromBackend({
                cartId: activeCartId!,
                itemId: cartItem.itemId,
                token
            })).unwrap()
            toast.info(`${product?.descripcion} quitado del carrito`, {
                position: "bottom-right",
                autoClose: 2000,
                theme: "colored",
            })
        } catch (error) {
            toast.error('Error al quitar el producto al carrito')
            console.error(error)
        } finally {
            setIsRemoving(false)
        }
    }

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true)
                // Use nrocta from URL if present (from vendor search), otherwise from selectedClient
                const effectiveNrocta = urlNrocta || selectedClient?.nrocta
                const data = await getProductById(tippro || '', artcod || '', effectiveNrocta || undefined)
                if (!data) {
                    setError('Producto no encontrado')
                } else {
                    setProduct(data)
                }
            } catch (err) {
                setError('Error al cargar el producto')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        if (tippro && artcod) fetchProduct()
    }, [tippro, artcod, urlNrocta, selectedClient?.nrocta])

    useEffect(() => {
        setSelectedMediaIndex(0)
    }, [tippro, artcod])

    useEffect(() => {
        if (!tippro || !artcod) return
        const controller = new AbortController()
        const key = `${tippro}-${artcod}`

        const fetchImages = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BACKEND}/api/public/productos/${encodeURIComponent(tippro)}/${encodeURIComponent(artcod)}/imagenes`,
                    { signal: controller.signal }
                )
                if (!response.ok) return
                const result: unknown = await response.json()
                if (Array.isArray(result)) {
                    setFetchedImages({ key, images: result as (ImagenUrlDTO | string)[] })
                }
            } catch (error) {
                if (!controller.signal.aborted) console.error('Error loading product images:', error)
            }
        }

        void fetchImages()
        return () => controller.abort()
    }, [tippro, artcod])

    useEffect(() => {
        if (!tippro || !artcod) return
        const effectiveNrocta = urlNrocta || selectedClient?.nrocta || undefined
        let cancelled = false
        setSustitutos([])
        setRelacionados([])
        fetchSustitutos(tippro, artcod, effectiveNrocta).then((r) => { if (!cancelled) setSustitutos(r) })
        fetchRelacionados(tippro, artcod, effectiveNrocta).then((r) => { if (!cancelled) setRelacionados(r) })
        return () => { cancelled = true }
    }, [tippro, artcod, urlNrocta, selectedClient?.nrocta])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>
    if (error || !product) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><h1 className="text-2xl font-bold">{error || 'Error'}</h1><button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded">Volver</button></div>

    // Función para obtener imagen con fallback a imagen genérica
    // (rechaza vacíos, "null" y URLs ".../null.jpg")
    const getImageWithFallback = (imgPath: string | null | undefined, isPrimary: boolean = false): string => {
        if (!isValidProductImageUrl(imgPath)) {
            return isPrimary
                ? PRODUCT_PLACEHOLDER
                : PRODUCT_PLACEHOLDER_SMALL
        }
        return imgPath
    }

    // Construir array de imágenes con fallback
    const buildImagesArray = (product: ProductoDTO) => {
        const imagesArray: { pathImagenChica: string; pathImagenGrande: string }[] = []

        // Si tiene array de imágenes
        if (product.imagenes && Array.isArray(product.imagenes) && product.imagenes.length > 0) {
            return product.imagenes.map(img => ({
                pathImagenChica: getImageWithFallback(img.pathImagenChica || img.pathImagenGrande),
                pathImagenGrande: getImageWithFallback(img.pathImagenGrande || img.pathImagenChica, true)
            }))
        }

        // Si tiene imgchi
        if (isValidProductImageUrl(product.imgchi)) {
            imagesArray.push({
                pathImagenChica: getImageWithFallback(product.imgchi),
                pathImagenGrande: getImageWithFallback(product.imggra || product.imgchi, true)
            })
        }

        // Si no tiene ninguna imagen, agregar placeholder
        if (imagesArray.length === 0) {
            imagesArray.push({
                pathImagenChica: PRODUCT_PLACEHOLDER_SMALL,
                pathImagenGrande: PRODUCT_PLACEHOLDER
            })
        }

        return imagesArray
    }

    const imageKey = `${tippro}-${artcod}`
    const endpointImages = fetchedImages?.key === imageKey ? fetchedImages.images : []
    const detailImages = buildImagesArray(product)
    const normalizedEndpointImages = endpointImages.flatMap((image) => {
        if (!image) return []
        const small = typeof image === 'string' ? image : image.pathImagenChica
        const large = typeof image === 'string' ? image : image.pathImagenGrande || image.pathImagenChica
        if (!isValidProductImageUrl(large)) return []
        return [{
            pathImagenChica: getImageWithFallback(small || large),
            pathImagenGrande: large.replace('_min.jpg', '.jpg'),
        }]
    })
    const primaryImage = isValidProductImageUrl(product.imgchi)
        ? { pathImagenChica: product.imgchi, pathImagenGrande: getImageWithFallback(product.imggra || product.imgchi, true).replace('_min.jpg', '.jpg') }
        : null
    const endpointWithPrimary = primaryImage && !normalizedEndpointImages.some((image) => image.pathImagenGrande === primaryImage.pathImagenGrande)
        ? [primaryImage, ...normalizedEndpointImages]
        : normalizedEndpointImages
    const images = normalizedEndpointImages.length > 0
        ? endpointWithPrimary.filter((image, index, all) =>
            all.findIndex((other) => other.pathImagenGrande === image.pathImagenGrande) === index
        )
        : detailImages
    const videoSlides = buildVideoSlides(product)
    const mediaSlides: MediaSlide[] = [
        ...images.map((_, imageIndex) => ({ kind: 'image' as const, imageIndex })),
        ...videoSlides.map((v) => ({ kind: 'video' as const, url: v.url, poster: v.poster })),
    ]
    const safeMediaIdx = Math.min(
        Math.max(0, selectedMediaIndex),
        Math.max(0, mediaSlides.length - 1)
    )
    const currentSlide = mediaSlides[safeMediaIdx] ?? mediaSlides[0]
    const mainImageSrc =
        currentSlide?.kind === 'image'
            ? images[currentSlide.imageIndex]?.pathImagenGrande || '/images/placeholder-generic.svg'
            : images[0]?.pathImagenGrande || '/images/placeholder-generic.svg'

    const esUSD = product.moneda === 'USD'
    const precioFinalARS = product.precioFinalPeso || 0
    const precioFinalUSD = product.precioFinalDolar
    const bonificacion = product.bonificacion ? Math.abs(Number(product.bonificacion)) : 0

    const {
        monedaAMostrar,
        simboloMoneda,
        tipoCambio,
        precioMostrar,
        precioListaMostrar,
    } = resolvePreciosMoneda({
        monedaProducto: product.moneda,
        currency,
        precioFinalPeso: precioFinalARS,
        precioFinalDolar: precioFinalUSD,
        precioReferencia: product.precioReferencia,
        cotizacionUSD: product.cotizacionUSD,
    })

    const format = (val: number) =>
        new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)

    const ofertaPrecios = resolveOfertaPrecios({
        enOferta: product.enOferta,
        itemProductoVentaEspeciales: product.itemProductoVentaEspeciales,
        precioMostrar,
        precioListaMostrar,
        bonificacion1: bonificacion,
        bonificacion2: bonif2,
        quantity,
        monedaAMostrar,
        tipoCambio,
    })
    const precioMarcadoMostrar = calcularPrecioPublico(precioMostrar, markupPercentage)

    const precioVentaUnitario = ofertaPrecios.precioOfertaUnitario
    const precioVentaTotal = ofertaPrecios.precioOferta
    const precioTotalMarcadoMostrar = (precioMarcadoMostrar || 0) * (quantity || 1)
    const showPrecioPromocional = debeMostrarPrecioPromocional(ofertaPrecios)
    const badgeModo = ofertaPrecios.modoDescuento === 'oferta'
        ? 'oferta' as const
        : bonificacion > 0
            ? 'bonificacion' as const
            : 'ninguno' as const

    const openGalleryFromMain = () => {
        if (currentSlide?.kind !== 'image') return
        if (images.length <= 1) return
        setGalleryIndex(currentSlide.imageIndex)
        setShowGallery(true)
    }

    const goPrevMedia = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (mediaSlides.length <= 1) return
        setSelectedMediaIndex((i) => (i - 1 + mediaSlides.length) % mediaSlides.length)
    }
    const goNextMedia = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (mediaSlides.length <= 1) return
        setSelectedMediaIndex((i) => (i + 1) % mediaSlides.length)
    }

    const thumbButtonClass = (active: boolean) =>
        clsx(
            'relative shrink-0 w-16 h-16 rounded-lg border overflow-hidden transition-all',
            active ? 'ring-2 ring-blue-600 border-blue-500 shadow-sm' : 'border-gray-200 hover:border-blue-300'
        )

    const effectiveNrocta = (urlNrocta || selectedClient?.nrocta || '').trim()
    const hrefCatalogo = (query: Record<string, string>) => {
        const p = new URLSearchParams()
        Object.entries(query).forEach(([k, v]) => {
            if (v) p.set(k, v)
        })
        if (effectiveNrocta) p.set('nrocta', effectiveNrocta)
        const qs = p.toString()
        return qs ? `/catalogo?${qs}` : '/catalogo'
    }
    const hrefInicio = hrefCatalogo({})
    const tipoTrim = product.tipo?.trim() || ''
    const subtipoTrim = product.subtipo?.trim() || ''
    const marcaTrim = product.marca?.trim() || ''
    const hrefTipo = tipoTrim ? hrefCatalogo({ tipo: tipoTrim }) : null
    const hrefSubtipo = subtipoTrim
        ? hrefCatalogo({
              ...(tipoTrim ? { tipo: tipoTrim } : {}),
              subtipo: subtipoTrim,
          })
        : null
    const hrefMarca = marcaTrim
        ? hrefCatalogo({
              ...(tipoTrim ? { tipo: tipoTrim } : {}),
              ...(subtipoTrim ? { subtipo: subtipoTrim } : {}),
              marca: marcaTrim,
          })
        : null

    const crumbLinkClass = 'uppercase tracking-wide hover:text-blue-600 transition-colors'
    const crumbCurrentClass = 'font-bold text-gray-800 uppercase tracking-wide'
    const aplicacionesNormalizadas: AplicacionDTO[] = Array.isArray(product.aplicaciones)
        ? product.aplicaciones
              .map((app) => ({
                  marca: normalizeNullableText(app?.marca),
                  modelo: normalizeNullableText(app?.modelo),
                  version: normalizeNullableText(app?.version),
                  cilindrada: normalizeNullableText(app?.cilindrada),
                  tipoMotor: normalizeNullableText(app?.tipoMotor),
                  adesde: normalizeNullableText(app?.adesde),
                  ahasta: normalizeNullableText(app?.ahasta),
                  annios: normalizeNullableText(app?.annios),
              }))
              .filter((app) =>
                  [
                      app.marca,
                      app.modelo,
                      app.version,
                      app.cilindrada,
                      app.tipoMotor,
                      app.adesde,
                      app.ahasta,
                      app.annios,
                  ].some(Boolean)
              )
        : []
    const atributosEntries = Object.entries(product.atributos ?? {})
        .map(([key, value]) => ({
            key,
            label: formatAttributeLabel(key),
            value: normalizeTextValue(value),
        }))
        .filter((attr) => attr.key.trim().length > 0 && attr.value.length > 0)
    const aplicacionesFiltradas = (() => {
        const query = normalizeTextValue(aplicacionesQuery).toLowerCase()
        if (!query) return aplicacionesNormalizadas
        const words = query.split(/\s+/).filter(Boolean)
        return aplicacionesNormalizadas.filter((app) =>
            words.every((word) => [
                app.marca,
                app.modelo,
                app.version,
                app.cilindrada,
                app.tipoMotor,
                app.adesde,
                app.ahasta,
            ]
                .map((value) => normalizeTextValue(value).toLowerCase())
                .join(' ')
                .includes(word))
        )
    })()
    const applicationRows = buildApplicationRows(aplicacionesFiltradas)
    const caracteristicasEntries = [
        { label: 'Tipo de producto', value: product.tipo },
        { label: 'Sub-tipo', value: product.subtipo },
        { label: 'Origen', value: product.importado === 'S' ? 'Importado' : 'Nacional' },
        { label: 'Marca', value: product.marca },
        { label: 'Nro parte', value: product.nroParte },
        { label: 'Unidad', value: product.unidadMedidaCatalogo || product.unidadMedida?.descripcion },
    ].filter((item) => normalizeTextValue(item.value).length > 0)
    const atributosHalf = Math.ceil(atributosEntries.length / 2)
    const atributosCol1 = atributosEntries.slice(0, atributosHalf)
    const atributosCol2 = atributosEntries.slice(atributosHalf)
    const caracteristicasHalf = Math.ceil(caracteristicasEntries.length / 2)
    const caracteristicasCol1 = caracteristicasEntries.slice(0, caracteristicasHalf)
    const caracteristicasCol2 = caracteristicasEntries.slice(caracteristicasHalf)

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
            <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                <Link href={hrefInicio} className={crumbLinkClass}>
                    Inicio
                </Link>
                <span className="text-gray-300">/</span>
                {tipoTrim ? (
                    <>
                        <Link href={hrefTipo!} className={crumbLinkClass}>
                            {product.tipo}
                        </Link>
                        <span className="text-gray-300">/</span>
                    </>
                ) : null}
                {subtipoTrim ? (
                    <>
                        <Link href={hrefSubtipo!} className={crumbLinkClass}>
                            {product.subtipo}
                        </Link>
                        <span className="text-gray-300">/</span>
                    </>
                ) : null}
                {marcaTrim ? (
                    <Link href={hrefMarca!} className={clsx(crumbCurrentClass, 'hover:text-blue-600 transition-colors')}>
                        {product.marca}
                    </Link>
                ) : (
                    <span className={crumbCurrentClass}>Marca</span>
                )}
                <span className="ml-auto">
                    <button type="button" onClick={() => router.back()} className="hover:text-blue-600 flex items-center text-xs font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        Volver
                    </button>
                </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    {/* Galería: miniaturas | imagen principal */}
                    <div className="lg:col-span-7 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-4 lg:gap-5">
                            {/* Miniaturas verticales (desktop) */}
                            <div className="hidden sm:flex flex-col gap-2 w-[72px] shrink-0 max-h-[min(520px,62vh)] overflow-y-auto overflow-x-hidden pr-1">
                                {mediaSlides.map((slide, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedMediaIndex(idx)}
                                        className={thumbButtonClass(safeMediaIdx === idx)}
                                    >
                                        {slide.kind === 'image' ? (
                                            <img
                                                src={getImageWithFallback(
                                                    images[slide.imageIndex]?.pathImagenChica || images[slide.imageIndex]?.pathImagenGrande
                                                )}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="relative w-full h-full bg-black flex items-center justify-center">
                                                {slide.poster ? (
                                                    <img src={slide.poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                ) : null}
                                                <Play className="w-7 h-7 text-white drop-shadow-md relative z-[1]" fill="currentColor" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 flex flex-col min-w-0">
                                <div
                                    className={clsx(
                                        'relative w-full aspect-square max-w-xl mx-auto bg-white rounded-xl border border-gray-100 overflow-hidden group',
                                        currentSlide?.kind === 'image' && images.length > 1 ? 'cursor-zoom-in' : 'cursor-default'
                                    )}
                                    onClick={openGalleryFromMain}
                                >
                                    <div className="absolute left-3 top-3 z-20 hidden sm:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <IconPill title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'} onClick={handleToggleFavorite}>
                                            <Heart className={isFav ? 'h-4 w-4 text-[#fb923c]' : 'h-4 w-4 text-[#001f3f]'} fill={isFav ? '#fb923c' : 'none'} />
                                        </IconPill>
                                        <IconPill title="Volver" onClick={() => router.back()}>
                                            <RotateCcw className="h-4 w-4 text-[#001f3f]" />
                                        </IconPill>
                                        <IconPill
                                            title="Copiar link"
                                            onClick={() => {
                                                void navigator.clipboard?.writeText(window.location.href)
                                                toast.success('Link copiado')
                                            }}
                                        >
                                            <Link2 className="h-4 w-4 text-[#001f3f]" />
                                        </IconPill>
                                        <IconPill title="Aplicaciones por motocicleta" onClick={() => setAplicacionesModalOpen(true)}>
                                            <Bike className="h-4 w-4 text-[#001f3f]" />
                                        </IconPill>
                                    </div>

                                    <DescuentoCornerBadges
                                        modoDescuento={badgeModo}
                                        bonificacion1={bonificacion}
                                        porcentajeOferta={ofertaPrecios.porcentajeOferta}
                                        size="detail"
                                        visible={isLoggedIn}
                                    />

                                    {currentSlide?.kind === 'video' ? (
                                        isYoutubeEmbedUrl(currentSlide.url) ? (
                                            <iframe
                                                key={currentSlide.url}
                                                src={currentSlide.url}
                                                title={`Video ${product.descripcion}`}
                                                className="w-full h-full bg-black"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                referrerPolicy="strict-origin-when-cross-origin"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <video
                                                key={currentSlide.url}
                                                src={currentSlide.url}
                                                poster={currentSlide.poster}
                                                controls
                                                playsInline
                                                className="w-full h-full object-contain bg-black"
                                            />
                                        )
                                    ) : (
                                        <img
                                            src={mainImageSrc}
                                            alt={product.descripcion}
                                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.02]"
                                        />
                                    )}

                                    {mediaSlides.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={goPrevMedia}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                                title="Anterior"
                                            >
                                                <ArrowLeft className="h-4 w-4 text-[#001f3f]" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={goNextMedia}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                                title="Siguiente"
                                            >
                                                <ArrowRight className="h-4 w-4 text-[#001f3f]" />
                                            </button>
                                            <div className="absolute bottom-3 left-3 bg-black/55 text-white text-[10px] font-black px-2 py-1 rounded-full backdrop-blur-sm z-10">
                                                {safeMediaIdx + 1}/{mediaSlides.length}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Miniaturas horizontales (móvil) */}
                                <div className="sm:hidden flex gap-2 mt-3 overflow-x-auto pb-1">
                                    {mediaSlides.map((slide, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedMediaIndex(idx)}
                                            className={thumbButtonClass(safeMediaIdx === idx)}
                                        >
                                            {slide.kind === 'image' ? (
                                                <img
                                                    src={getImageWithFallback(
                                                        images[slide.imageIndex]?.pathImagenChica || images[slide.imageIndex]?.pathImagenGrande
                                                    )}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="relative w-full h-full bg-black flex items-center justify-center">
                                                    {slide.poster ? (
                                                        <img src={slide.poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                    ) : null}
                                                    <Play className="w-6 h-6 text-white relative z-[1]" fill="currentColor" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Columna derecha: datos (estilo ProductCard) */}
                    <div className="lg:col-span-5 p-6 lg:p-8 lg:pl-6 flex flex-col h-full">
                        <div className="mb-auto">
                            <div className="mb-1">
                                <NuevoProductBadge
                                    visible={isProductoNuevo(product.nuevo)}
                                    size="detail"
                                />
                            </div>
                            <p className="text-blue-600 text-[10px] font-extrabold uppercase tracking-widest mb-1">{product.marca || 'GENÉRICO'}</p>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 uppercase leading-snug mb-4">{product.descripcion}</h1>

                            <p className="text-[11px] font-medium text-gray-500 mb-1">Cod:</p>
                            <p className="mb-5">
                                <span className="inline-block bg-sky-100 text-gray-900 font-bold text-sm px-2 py-1 rounded-md tracking-wide">
                                    {product.tippro}
                                    {product.artcod}
                                </span>
                            </p>
                            {product.nroParte && (
                                <p className="text-xs text-gray-500 mb-4">
                                    Part No: <span className="font-semibold text-gray-800">{product.nroParte}</span>
                                </p>
                            )}

                            {product.itemProductoVentaEspeciales &&
                                product.itemProductoVentaEspeciales.length > 0 && (
                                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-amber-900 mb-3">
                                        Ventas especiales
                                    </h2>
                                    <ProductPools
                                        pools={product.itemProductoVentaEspeciales}
                                        showCountdown={isLoggedIn}
                                        enOferta={product.enOferta}
                                        ofertaPrecios={ofertaPrecios}
                                    />
                                </div>
                            )}

                            {product.presentaciones && product.presentaciones.length > 0 && (
                                <div className="mb-5 space-y-1">
                                    {(() => {
                                        const withBarcode = product.presentaciones!.filter(
                                            (p) => (p?.codigoBarra ?? '').toString().trim().length > 0
                                        )
                                        const list = (withBarcode.length > 0 ? withBarcode : product.presentaciones!).slice(0, 3)
                                        return list.map((p, i) => (
                                            <div
                                                key={`${p?.tipoEnvase ?? 'x'}-${i}`}
                                                className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 w-fit max-w-full"
                                                title={`Envase ${p.tipoEnvase}${unidadPresentacionLabel(p) ? ` ${unidadPresentacionLabel(p)}` : ''}${p.cantidad != null ? ` ${p.cantidad}` : ''}${product.unidadMedidaCatalogo ? ` ${product.unidadMedidaCatalogo}` : ''}`}
                                            >
                                                {i + 1}° Envase
                                                {unidadPresentacionLabel(p) ? ` ${unidadPresentacionLabel(p)}` : ''}
                                                {p?.cantidad != null ? ` ${p.cantidad}` : ''}
                                                {product.unidadMedidaCatalogo ? ` ${product.unidadMedidaCatalogo}` : ''}
                                                {pesoPresentacionLabel(p) ? ` ${pesoPresentacionLabel(p)}` : ''}
                                            </div>
                                        ))
                                    })()}
                                </div>
                            )}

                            {isLoggedIn && (
                                <div className="mb-4 flex flex-wrap items-center gap-3 border-y border-gray-100 py-3 sm:gap-4">
                                    <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={showPurchasePrice}
                                            onChange={togglePurchasePrice}
                                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Precio Compra</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={showPublicPrice}
                                            onChange={() => {
                                                if (!showPublicPrice && markupPercentage <= 0) {
                                                    setShowMarkupWarning(true)
                                                } else {
                                                    togglePublicPrice()
                                                }
                                            }}
                                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Precio Público</span>
                                    </label>
                                    <label className="flex items-center gap-2 rounded bg-gray-100 px-3 py-1.5" title="Porcentaje de aumento para el precio público">
                                        <Calculator size={14} className="text-gray-500" />
                                        <span className="sr-only">Porcentaje de precio público</span>
                                        <input
                                            type="number"
                                            value={markupPercentage}
                                            onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                                            className="w-12 bg-transparent text-right text-sm font-medium text-gray-900 focus:outline-none"
                                            min="0"
                                            max="100"
                                            aria-label="Porcentaje de precio público"
                                        />
                                    </label>
                                    <div className="flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Moneda">
                                        {(['ARS', 'USD'] as const).map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setCurrency(value)}
                                                aria-pressed={currency === value}
                                                className={clsx(
                                                    'rounded px-3 py-1 text-xs font-bold transition-colors',
                                                    currency === value ? 'bg-[#001f3f] text-white' : 'text-gray-500 hover:text-gray-700'
                                                )}
                                            >
                                                {value}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isLoggedIn ? (
                                <div className="space-y-3 mb-6">
                                    {showPurchasePrice && (
                                        showPrecioPromocional ? (
                                            <OfertaPrecioDisplay
                                                oferta={ofertaPrecios}
                                                simboloMoneda={simboloMoneda}
                                                format={format}
                                                quantity={quantity}
                                                variant="detail"
                                            />
                                        ) : (
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                                    {quantity > 1 ? `Total (${quantity} u.)` : 'Precio final:'}
                                                </p>
                                                <p className="text-2xl sm:text-3xl font-black text-[#0056b3] leading-tight">
                                                    {simboloMoneda}
                                                    {format(quantity > 1 ? precioVentaTotal : precioVentaUnitario)}
                                                </p>
                                                {quantity > 1 && (
                                                    <p className="text-[10px] font-bold text-gray-400">
                                                        Unit.: {simboloMoneda}{format(precioVentaUnitario)}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    )}
                                    {showPurchasePrice && tienePrecioListaVisible(precioListaMostrar, precioVentaUnitario) && !showPrecioPromocional && (
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                                            Precio lista:{' '}
                                            <span className="line-through text-gray-400 font-semibold normal-case text-sm">
                                                {simboloMoneda}
                                                {format(precioListaMostrar)}
                                            </span>
                                        </p>
                                    )}
                                    {showPublicPrice && markupPercentage > 0 && (
                                        <div className="flex flex-col items-start">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Precio público:</span>
                                            <span className="flex items-baseline gap-2 flex-wrap">
                                                <span className="text-[15px] font-bold text-[#fb923c] leading-none">
                                                    {simboloMoneda}
                                                    {format(quantity > 1 ? precioTotalMarcadoMostrar : precioMarcadoMostrar)}
                                                </span>
                                            </span>
                                            {quantity > 1 && (
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    Unit.: {simboloMoneda}{format(precioMarcadoMostrar)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-400">
                                        IVA incluido. Precio sujeto a cambios.
                                        {esUSD && monedaAMostrar === 'ARS' && precioFinalUSD
                                            ? ` (≈ US$ ${format(precioFinalUSD)} USD)`
                                            : null}
                                        {esUSD && monedaAMostrar === 'USD' ? ` (≈ $ ${format(precioFinalARS)} ARS)` : null}
                                        {!esUSD && monedaAMostrar === 'USD' ? ` (desde $ ${format(precioFinalARS)} ARS)` : null}
                                    </p>
                                </div>
                            ) : (
                                <div className="py-6 mb-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                                    <p className="text-gray-600 text-sm mb-2">Iniciá sesión para ver precios.</p>
                                    <Link href="/?login=1" className="text-[#0056b3] font-bold text-sm hover:underline">
                                        Ingresar
                                    </Link>
                                </div>
                            )}

                            {isLoggedIn && (
                                <div className="mb-6">
                                    {String((product as any).productoAPedido || (product as any).productoApedido || '').toUpperCase() === 'S' ? (
                                        <p className="text-[11px] text-amber-700 font-semibold mb-2">
                                            Producto a pedido. Consultar por favor.
                                        </p>
                                    ) : null}
                                    <BranchStockDisplay
                                        userTipo={user?.tipo}
                                        verStock={user?.verStock}
                                        stockList={(product as any).stock}
                                        stockNoa={product.stockNoa}
                                        stockNea={product.stockNea}
                                        stockBue={product.stockBue}
                                        stockCuy={product.stockCuy}
                                        variant="compact"
                                    />
                                    {(() => {
                                        const raw = (product as { proximoIngreso?: string | null }).proximoIngreso;
                                        if (!raw) return null;
                                        const d = new Date(raw);
                                        if (Number.isNaN(d.getTime())) return null;
                                        const label = d.toLocaleDateString('es-AR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                        });
                                        return (
                                            <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-900">
                                                <span className="font-bold">Próximo ingreso: </span>
                                                {label}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {isLoggedIn && ['V', 'A', 'S', 'B'].includes(user?.tipo || '') && (
                            <div className="flex items-center justify-between px-1 mb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Bonificación %:</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={bonif2}
                                    disabled={isAdding || isRemoving || isUpdatingBonif2}
                                    onChange={(e) => setBonif2FromUi(Number(e.target.value))}
                                    className="w-14 h-7 border border-gray-200 rounded-md text-center font-bold text-red-600 text-xs outline-none focus:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                            </div>
                        )}

                        <div className="mt-auto flex flex-col gap-3">
                            {isLoggedIn && (
                                <div className="flex gap-2 items-stretch">
                                    <button
                                        type="button"
                                        onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
                                        disabled={isAdding || isRemoving || cartLoading || isUpdatingQty}
                                        className={clsx(
                                            'flex-grow min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wide transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                            isInCart
                                                ? 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100'
                                                : 'bg-[#0056b3] text-white hover:bg-[#004085]'
                                        )}
                                    >
                                        {isAdding || isRemoving ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : isInCart ? (
                                            <>
                                                <Trash2 size={16} /> Quitar
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart size={16} /> Agregar al carrito
                                            </>
                                        )}
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(e) => setQuantityFromUi(parseInt(e.target.value, 10) || 1)}
                                        disabled={isAdding || isRemoving || cartLoading || isUpdatingQty}
                                        className="w-14 h-11 border border-gray-100 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <section className="mt-8 rounded-md border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
                <h2 className="mb-4 text-[22px] font-bold text-slate-900">Descripción</h2>
                <p className="text-gray-700 text-xs leading-5">{product.descripcion}</p>
                <div className="mt-4 text-xs text-gray-600 leading-5">
                    <p>
                        Este producto forma parte del catálogo técnico INTERCAP. Verifique compatibilidad por medida, uso y
                        aplicación antes de realizar la compra.
                    </p>
                </div>
            </section>

            <section className="product-details-grid mt-6 items-stretch gap-6">
                <div className="flex min-w-0 flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                    <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-5 py-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-[22px] font-bold text-slate-900">Aplicaciones por Motocicleta</h3>
                            <span className="rounded border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                                {aplicacionesNormalizadas.length} compatibilidades
                            </span>
                        </div>
                        <div className="relative">
                            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={aplicacionesQuery}
                                onChange={(e) => setAplicacionesQuery(e.target.value)}
                                placeholder="Buscar por marca (ej. Honda), modelo (ej. Titan) o cilindrada (150)..."
                                className="w-full rounded-md border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-xs text-gray-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        {aplicacionesNormalizadas.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-500">
                                No hay aplicaciones cargadas para este producto.
                            </div>
                        ) : aplicacionesFiltradas.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-500">
                                No hay resultados para &ldquo;{normalizeTextValue(aplicacionesQuery)}&rdquo;.
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-auto">
                                <table className="w-full min-w-[620px] border-collapse bg-white text-xs">
                                    <thead className="sticky top-0 z-10 bg-white text-[11px] uppercase text-slate-900">
                                        <tr>
                                            {(['Marca', 'Modelo', 'Cilindrada', 'Versión', 'Desde', 'Hasta'] as const).map((h) => (
                                                <th
                                                    key={h}
                                                    className="border-b border-r border-gray-200 px-3 py-3 text-left font-bold last:border-r-0"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applicationRows.map(({ app, marcaSpan, modeloSpan, cilindradaSpan }, idx) => (
                                            <tr key={`${app.marca}-${app.modelo}-${app.cilindrada}-${app.version}-${idx}`} className="border-b border-gray-200 bg-white">
                                                {marcaSpan > 0 && (
                                                    <td rowSpan={marcaSpan} className="border-r border-gray-200 bg-white px-3 py-2 align-middle font-bold uppercase text-slate-900">
                                                        {app.marca || '—'}
                                                    </td>
                                                )}
                                                {modeloSpan > 0 && (
                                                    <td rowSpan={modeloSpan} className="border-r border-gray-200 bg-white px-3 py-2 align-middle font-semibold uppercase text-slate-900">
                                                        {app.modelo || '—'}
                                                    </td>
                                                )}
                                                {cilindradaSpan > 0 && (
                                                    <td rowSpan={cilindradaSpan} className="border-r border-gray-200 bg-white px-3 py-2 text-center align-middle font-semibold text-slate-900">
                                                        {app.cilindrada ? `${app.cilindrada}${/cc\b/i.test(app.cilindrada) ? '' : ' cc'}` : '—'}
                                                    </td>
                                                )}
                                                <td className="border-r border-gray-200 px-3 py-2 text-slate-900">
                                                    {app.version && app.version !== '-' && app.version.toLowerCase() !== 'base' ? app.version : <span className="italic text-slate-400">Base</span>}
                                                </td>
                                                <td className="border-r border-gray-200 px-3 py-2 text-center font-mono text-slate-900">{app.adesde || '—'}</td>
                                                <td className="px-3 py-2 text-center font-mono text-slate-900">{app.ahasta || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-[22px] font-bold text-slate-900">Atributos</h3>
                        </div>
                        {atributosEntries.length > 0 ? (
                            <div className="product-attributes-columns">
                                <div>
                                    {atributosCol1.map((attr) => (
                                        <ProductInfoRow key={attr.key} label={attr.label} value={attr.value} />
                                    ))}
                                </div>
                                <div className="md:border-l md:border-gray-200 md:pl-4 lg:pl-6">
                                    {atributosCol2.map((attr) => (
                                        <ProductInfoRow key={attr.key} label={attr.label} value={attr.value} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic">No hay atributos técnicos cargados.</p>
                        )}
                    </div>

                    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-[22px] font-bold text-slate-900">Características</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
                            <div>
                                {caracteristicasCol1.map((item) => (
                                    <ProductInfoRow key={item.label} label={item.label} value={normalizeTextValue(item.value)} />
                                ))}
                            </div>
                            <div className="md:border-l md:border-gray-200 md:pl-4">
                                {caracteristicasCol2.map((item) => (
                                    <ProductInfoRow key={item.label} label={item.label} value={normalizeTextValue(item.value)} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {sustitutos.length > 0 && (
                <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
                    <h2 className="mb-4 text-[22px] font-bold text-slate-900">Sustitutos</h2>
                    <ProductVinculadosGrid products={sustitutos} embeddedInVinculados />
                </section>
            )}

            {relacionados.length > 0 && (
                <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
                    <h2 className="mb-4 text-[22px] font-bold text-slate-900">Relacionados</h2>
                    <ProductVinculadosGrid products={relacionados} embeddedInVinculados />
                </section>
            )}

            <Modal isOpen={showMarkupWarning} onClose={() => setShowMarkupWarning(false)} contentClassName="w-full max-w-md rounded-lg bg-white shadow-xl">
                <div className="p-6">
                    <h3 className="mb-2 text-center text-xl font-bold text-gray-900">Markup no configurado</h3>
                    <p className="mb-5 text-center text-sm text-gray-600">
                        Para mostrar el precio público, ingresá un porcentaje de markup.
                    </p>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowMarkupWarning(false)} className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-bold text-gray-700 hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="button" onClick={() => { togglePublicPrice(); setShowMarkupWarning(false) }} className="flex-1 rounded-lg bg-[#001f3f] px-4 py-2 font-bold text-white hover:bg-[#003366]">
                            Mostrar igual
                        </button>
                    </div>
                </div>
            </Modal>

            {showGallery && (
                <ProductGalleryModal
                    images={images}
                    initialIndex={galleryIndex}
                    onClose={() => setShowGallery(false)}
                />
            )}

            <AplicacionesMotocicletaModal
                isOpen={aplicacionesModalOpen}
                onClose={() => setAplicacionesModalOpen(false)}
                aplicaciones={aplicacionesNormalizadas}
            />
        </div>
    )
}

function IconPill({ title, children, onClick }: { title: string; children: React.ReactNode; onClick?: () => void }) {
    return (
        <button
            type="button"
            title={title}
            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow border border-white/60 flex items-center justify-center hover:bg-white transition-colors"
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClick?.()
            }}
        >
            {children}
        </button>
    )
}

function DetailRow({ label, value }: { label: string, value: any }) {
    if (!value) return null;
    return (
        <div className="flex border-b border-gray-100 py-3">
            <span className="w-1/3 text-gray-500 font-medium text-sm">{label}</span>
            <span className="w-2/3 text-gray-900 font-semibold text-sm">{value}</span>
        </div>
    )
}
