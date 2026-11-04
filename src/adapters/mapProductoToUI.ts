import { ProductoDTO } from '@/interfaces/producto'
import { isValidProductImageUrl, sanitizeProductImageUrl } from '@/utils/productImage'

export function mapProductoToUI(
    producto: ProductoDTO,
    imagesFromHook: any[] = []
): any {
    // Obtener la imagen principal
    const mainImage = sanitizeProductImageUrl(producto.imgchi)

    // Procesar imágenes del backend a strings simples - SOLO usar pathImagenGrande
    let backendImages: string[] = []
    if (producto.imagenes && producto.imagenes.length > 0) {
        backendImages = producto.imagenes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((img: any) => {
                // SOLO usar pathImagenGrande
                let url = img.pathImagenGrande
                if (!isValidProductImageUrl(url)) {
                    return null
                }
                // IMPORTANTE: Reemplazar _min.jpg con .jpg para obtener la imagen grande
                if (url.includes('_min.jpg')) {
                    url = url.replace('_min.jpg', '.jpg')
                }
                return url
            })
            .filter((url): url is string => url !== null && url.length > 0)
    }

    // Procesar imágenes del hook a strings - SOLO usar pathImagenGrande
    // Si no hay imagen grande, intentar obtenerla reemplazando _min.jpg a .jpg para obtener la imagen grande
    const hookImages: string[] = (imagesFromHook || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((i: any) => {
            // Si es string directa, usarla
            let url = typeof i === 'string' ? i : i.pathImagenGrande
            // Si no hay pathImagenGrande o está vacio, usar pathImagenChica
            if (!isValidProductImageUrl(url) && typeof i !== 'string') {
                url = i.pathImagenChica
            }
            // Filtrar valores inválidos (incluye URLs ".../null.jpg")
            if (!isValidProductImageUrl(url)) {
                return null
            }
            // IMPORTANTE: Reemplazar _min.jpg con .jpg para obtener la imagen grande
            // Las imágenes en la base de datos tienen _min para las pequeñas
            if (url.includes('_min.jpg')) {
                url = url.replace('_min.jpg', '.jpg')
            }
            return url
        })
        .filter((url): url is string => url !== null && url.length > 0)

    // Elegir imágenes: hook > backend > mainImage
    // El hook tiene las imágenes más actualizadas del endpoint /imagenes
    let imageArray: string[] = []

    if (hookImages.length > 0) {
        imageArray = hookImages
    } else if (backendImages.length > 0) {
        imageArray = backendImages
    } else if (mainImage) {
        imageArray = [mainImage]
    }

    // Asegurar que la imagen principal esté primera
    if (mainImage && imageArray.length > 0 && !imageArray.includes(mainImage)) {
        imageArray = [mainImage, ...imageArray]
    }

    // Retornar con imágenes procesadas
    return {
        ...producto,
        images: imageArray,
    }
}
