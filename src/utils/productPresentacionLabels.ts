/** Etiquetas de presentación alineadas con ProductCard / detalle de producto. */

export function unidadPresentacionLabel(p: { unidadMedidaDescrp?: string | null; unidadMedida?: string | null }) {
    return (p?.unidadMedidaDescrp ?? p?.unidadMedida ?? '').toString().trim()
}

function formatPeso2(peso: number): string {
    return Number(peso).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

export function pesoPresentacionLabel(p: { peso?: number | null; unidadPeso?: string | null }) {
    const peso = p?.peso
    const unidad = (p?.unidadPeso ?? '').toString().trim()
    if (peso == null || Number.isNaN(Number(peso))) return ''
    const pesoFmt = formatPeso2(Number(peso))
    if (!unidad) return pesoFmt
    const unidadPretty = unidad === 'KGS' ? 'Kgs' : unidad
    return `${pesoFmt} ${unidadPretty}`
}
