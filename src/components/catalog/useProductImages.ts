import { useEffect, useRef, useState } from 'react'
export function useProductImages(products: any[]) {
    const [images, setImages] = useState<Record<string, any[]>>({})
    const [loading, setLoading] = useState<Record<string, boolean>>({})
    const cache = useRef<Record<string, any[]>>({})
    useEffect(() => {
        products.forEach(async (p) => {
            const key = `${p.tippro}-${p.artcod}`
            // Si ya tiene imágenes del hook cacheadas, usarlas
            if (cache.current[key]) {
                setImages(prev => ({ ...prev, [key]: cache.current[key] }))
                return
            }
            setLoading(prev => ({ ...prev, [key]: true }))
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BACKEND}/api/public/productos/${p.tippro}/${p.artcod}/imagenes`
                )
                if (res.ok) {
                    const imgs = await res.json()
                    // Siempre cacheamos y actualizamos las imágenes del endpoint
                    cache.current[key] = imgs
                    setImages(prev => ({ ...prev, [key]: imgs }))
                }
            } catch (error) {
                console.error('Error loading product images:', error)
            } finally {
                setLoading(prev => ({ ...prev, [key]: false }))
            }
        })
    }, [products])
    return { images, loading }
}