/**
 * Copia tipo/subtipo/marca de producto y facetas attr_* desde la URL del catálogo
 * hacia params de API. Así el buscador por moto (aplicaciones) se acota al mismo
 * alcance que los filtros del sidebar, como en el legacy (Rubros + Moto).
 */
export function addCatalogScopeToSearchParams(
    target: URLSearchParams,
    source: URLSearchParams | null | undefined
): void {
    if (!source) return
    const tipo = source.get('tipo') || source.get('rubro')
    if (tipo) target.set('tipo', tipo)
    const subtipo = source.get('subtipo')
    if (subtipo) target.set('subtipo', subtipo)
    const marca = source.get('marca')
    if (marca) target.set('marca', marca)
    source.forEach((value, key) => {
        if (key.startsWith('attr_')) {
            target.set(key, value)
        }
    })
}
