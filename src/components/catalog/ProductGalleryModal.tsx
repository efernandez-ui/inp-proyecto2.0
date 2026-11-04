'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { isValidProductImageUrl, PRODUCT_PLACEHOLDER } from '@/utils/productImage'
interface Props {
    images: any[]
    initialIndex: number
    onClose: () => void
}
function ProductGalleryModal({ images, initialIndex, onClose }: Props) {
    const [index, setIndex] = useState(initialIndex)
    const [zoom, setZoom] = useState(false)
    const [origin, setOrigin] = useState('center')
    const [loadingImg, setLoadingImg] = useState(true)
    const touchStart = useRef(0)
    const lastTap = useRef(0)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight') next()
            if (e.key === 'ArrowLeft') prev()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])
    // Efecto deprecarga de imágenes adyacentes
    // Deshabilitado temporalmente porque puede causar problemas con la carga
    // useEffect(() => {
    //     if (!images.length) return
    //     const preload = (i: number) => {
    //         const img = new window.Image()
    //         const src = getImageSrc(images[i])
    //         if (src) img.src = src
    //     }
    //     preload((index + 1) % images.length)
    //     preload(index === 0 ? images.length - 1 : index - 1)
    // }, [index, images])

    const next = () => {
        setZoom(false)
        setIndex((i) => (i + 1) % images.length)
    }
    const prev = () => {
        setZoom(false)
        setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
    }
    const getImageSrc = (img: string | any): string => {
        let url = ''
        if (typeof img === 'string') {
            // Filtrar valores inválidos (incluye URLs ".../null.jpg")
            if (!isValidProductImageUrl(img)) {
                return ''
            }
            url = img
        } else {
            // SOLO usar pathImagenGrande - no usar la chica
            url = img?.pathImagenGrande
            if (!isValidProductImageUrl(url)) {
                return ''
            }
        }
        // IMPORTANTE: Reemplazar _min.jpg con .jpg para obtener la imagen grande
        if (url.includes('_min.jpg')) {
            url = url.replace('_min.jpg', '.jpg')
        }
        return url
    }
    const imageSrc = getImageSrc(images[index])
    const imageKey = imageSrc || `empty-${index}`

    // Reset loading when imageSrc changes (when navigating to different image)
    useEffect(() => {
        setLoadingImg(true)
    }, [imageSrc])

    return (
        <div
            className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-6xl h-[85vh] bg-black rounded-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
                onTouchEnd={(e) => {
                    const diff =
                        touchStart.current - e.changedTouches[0].clientX
                    if (diff > 60) next()
                    if (diff < -60) prev()
                    const now = Date.now()
                    if (now - lastTap.current < 300) {
                        setZoom((z) => !z)
                        setOrigin('center')
                    }
                    lastTap.current = now
                }}
            >
                <div
                    className="absolute inset-0"
                    onMouseMove={(e) => {
                        if (!zoom) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x =
                            ((e.clientX - rect.left) / rect.width) * 100
                        const y =
                            ((e.clientY - rect.top) / rect.height) * 100
                        setOrigin(`${x}% ${y}%`)
                    }}
                    onMouseEnter={() => setZoom(true)}
                    onMouseLeave={() => {
                        setZoom(false)
                        setOrigin('center')
                    }}
                >
                    {loadingImg && imageSrc && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                            <div className="h-12 w-12 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        </div>
                    )}
                    {imageSrc ? (
                        <Image
                            key={imageKey}
                            src={imageSrc}
                            alt=""
                            fill
                            priority
                            sizes="100vw"
                            className={`object-contain transition-opacity duration-300 ${loadingImg ? 'opacity-0' : 'opacity-100'
                                }`}
                            onLoad={() => setLoadingImg(false)}
                            onError={() => setLoadingImg(false)}
                            unoptimized
                            style={{
                                transform: zoom ? 'scale(1.8)' : 'scale(1)',
                                transformOrigin: origin,
                            }}
                        />
                    ) : (
                        <Image
                            key={imageKey}
                            src={PRODUCT_PLACEHOLDER}
                            alt=""
                            fill
                            sizes="100vw"
                            className="object-contain"
                            onLoad={() => setLoadingImg(false)}
                            unoptimized
                        />
                    )}
                </div>
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="
    absolute z-20 left-3 top-1/2 -translate-y-1/2
    h-14 w-14
    flex items-center justify-center
    rounded-full
    bg-white/80 backdrop-blur
    text-black text-3xl
    shadow-lg
    hover:bg-white
    active:scale-95
  "
                        >
                            ‹
                        </button>
                        <button
                            onClick={next}
                            className="
    absolute z-20 right-3 top-1/2 -translate-y-1/2
    h-14 w-14
    flex items-center justify-center
    rounded-full
    bg-white/80 backdrop-blur
    text-black text-3xl
    shadow-lg
    hover:bg-white
    active:scale-95
  "
                        >
                            ›
                        </button>
                    </>
                )}
                {images.length > 1 && (
                    <div className="absolute z-10 bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndex(i)}
                                className={`h-2 rounded-full transition-all ${i === index
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 w-2'
                                    }`}
                            />
                        ))}
                    </div>
                )}
                <button
                    onClick={onClose}
                    className="absolute z-10 top-4 right-4 text-white text-2xl"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
export default ProductGalleryModal
