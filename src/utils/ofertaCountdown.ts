import { ProductoVentaEspecial } from '@/interfaces/producto'
import { OfertaPrecioDisplay } from './ofertaPrecios'

const SENTINEL_MIN = new Date(1900, 0, 2)
const SENTINEL_MAX = new Date(2099, 11, 30)

export type CountdownProgress = {
    progressPct: number
    remainingMs: number
    expired: boolean
}

export type OfertaCountdownContext = {
    pool: ProductoVentaEspecial | null
    shouldShow: boolean
}

/** Parsea ISO como hora local de negocio (sin desplazamiento UTC). */
export function parseOfertaFecha(iso: string | null | undefined): Date | null {
    if (!iso || typeof iso !== 'string') return null
    const trimmed = iso.trim()
    if (!trimmed) return null

    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
    if (!match) return null

    const year = Number(match[1])
    const month = Number(match[2]) - 1
    const day = Number(match[3])
    const hour = Number(match[4])
    const minute = Number(match[5])
    const second = Number(match[6] ?? '0')

    if ([year, month, day, hour, minute, second].some((n) => Number.isNaN(n))) {
        return null
    }

    return new Date(year, month, day, hour, minute, second)
}

export function isFechaCierreReal(dishas: string | Date | null | undefined): boolean {
    const date = typeof dishas === 'string' ? parseOfertaFecha(dishas) : dishas ?? null
    if (!date || Number.isNaN(date.getTime())) return false
    if (date.getTime() <= SENTINEL_MIN.getTime()) return false
    if (date.getTime() >= SENTINEL_MAX.getTime()) return false
    return true
}

export function computeCountdownProgress(
    disdes: string | Date | null | undefined,
    dishas: string | Date | null | undefined,
    now: Date = new Date()
): CountdownProgress {
    const end = typeof dishas === 'string' ? parseOfertaFecha(dishas) : dishas ?? null
    if (!end || !isFechaCierreReal(end)) {
        return { progressPct: 0, remainingMs: 0, expired: true }
    }

    const startRaw = typeof disdes === 'string' ? parseOfertaFecha(disdes) : disdes ?? null
    const start = startRaw && !Number.isNaN(startRaw.getTime()) ? startRaw : now
    const nowMs = now.getTime()
    const startMs = start.getTime()
    const endMs = end.getTime()

    if (endMs <= nowMs) {
        return { progressPct: 100, remainingMs: 0, expired: true }
    }

    const totalMs = Math.max(endMs - startMs, 1)
    const elapsedMs = Math.max(0, nowMs - startMs)
    const remainingMs = endMs - nowMs
    const progressPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))

    return { progressPct, remainingMs, expired: false }
}

export function formatTiempoRestante(remainingMs: number): string {
    if (remainingMs <= 0) return ''

    const totalSeconds = Math.floor(remainingMs / 1000)
    const days = Math.floor(totalSeconds / 86_400)
    const hours = Math.floor((totalSeconds % 86_400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (days >= 1) {
        const dayLabel = days === 1 ? 'DÍA' : 'DÍAS'
        if (hours > 0 || minutes > 0 || seconds > 0) {
            return `FALTAN ${days} ${dayLabel} ${hours}H ${String(minutes).padStart(2, '0')}M ${String(seconds).padStart(2, '0')}S`
        }
        return `FALTAN ${days} ${dayLabel}`
    }

    if (hours > 0) {
        return `FALTAN ${hours}H ${String(minutes).padStart(2, '0')}M ${String(seconds).padStart(2, '0')}S`
    }

    if (minutes > 0) {
        return `FALTAN ${minutes}M ${String(seconds).padStart(2, '0')}S`
    }

    return `FALTAN ${seconds}S`
}

/** Convierte epoch ms del API a ISO local para parseOfertaFecha / useOfertaCountdown. */
export function epochMillisToCountdownInput(ms: number | null | undefined): string | null {
    if (ms == null || !Number.isFinite(ms)) return null
    const d = new Date(ms)
    if (Number.isNaN(d.getTime())) return null
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Label corto para cards de home: "2 días rest." */
export function formatDiasRestantesCorto(remainingMs: number): string {
    if (remainingMs <= 0) return ''

    const totalSeconds = Math.floor(remainingMs / 1000)
    const days = Math.floor(totalSeconds / 86_400)
    const hours = Math.floor((totalSeconds % 86_400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (days >= 1) {
        return days === 1 ? '1 día rest.' : `${days} días rest.`
    }
    if (hours >= 1) {
        return `${hours} h rest.`
    }
    if (minutes >= 1) {
        return `${minutes} min rest.`
    }
    return 'Termina pronto'
}

/** Restan 2 días o menos (badge "Termina pronto"). */
export function terminaProntoPorTiempo(remainingMs: number): boolean {
    return remainingMs > 0 && remainingMs <= 2 * 86_400 * 1000
}

function poolTieneStockVendible(pool: ProductoVentaEspecial | undefined): boolean {
    if (!pool) return false
    const stock = pool.cantidadDisponible
    if (stock == null) return true
    return Number(stock) > 0
}

export function resolveOfertaCountdownContext(input: {
    enOferta?: string | null
    itemProductoVentaEspeciales?: ProductoVentaEspecial[]
    ofertaPrecios?: Pick<OfertaPrecioDisplay, 'modoDescuento' | 'aplicaOfertaStock'>
}): OfertaCountdownContext {
    const pool = input.itemProductoVentaEspeciales?.[0] ?? null
    const enOferta = (input.enOferta ?? '').trim() === 'S'
    const modoOferta = input.ofertaPrecios?.modoDescuento === 'oferta'
        || input.ofertaPrecios?.aplicaOfertaStock === true

    const shouldShow = Boolean(
        pool
        && enOferta
        && modoOferta
        && pool.cuentaRegresiva === true
        && poolTieneStockVendible(pool)
        && isFechaCierreReal(pool.ofertaDishas)
        && !computeCountdownProgress(pool.ofertaDisdes, pool.ofertaDishas).expired
    )

    return { pool, shouldShow }
}
