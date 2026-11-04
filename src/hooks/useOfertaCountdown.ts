'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    computeCountdownProgress,
    formatTiempoRestante,
    isFechaCierreReal,
    parseOfertaFecha,
} from '@/utils/ofertaCountdown'

type Input = {
    ofertaDisdes?: string | null
    ofertaDishas?: string | null
    enabled?: boolean
}

export function useOfertaCountdown({ ofertaDisdes, ofertaDishas, enabled = true }: Input) {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        if (!enabled || !isFechaCierreReal(ofertaDishas)) {
            return
        }

        const tick = () => setNow(new Date())
        tick()

        const intervalId = window.setInterval(tick, 1000)
        return () => window.clearInterval(intervalId)
    }, [enabled, ofertaDisdes, ofertaDishas])

    return useMemo(() => {
        if (!enabled || !isFechaCierreReal(ofertaDishas)) {
            return { progressPct: 0, label: '', expired: true, visible: false }
        }

        const end = parseOfertaFecha(ofertaDishas)
        if (!end) {
            return { progressPct: 0, label: '', expired: true, visible: false }
        }

        const { progressPct, remainingMs, expired } = computeCountdownProgress(
            ofertaDisdes,
            ofertaDishas,
            now
        )

        if (expired || remainingMs <= 0) {
            return { progressPct: 100, label: '', expired: true, visible: false }
        }

        return {
            progressPct,
            label: formatTiempoRestante(remainingMs),
            expired: false,
            visible: true,
        }
    }, [enabled, ofertaDisdes, ofertaDishas, now])
}
