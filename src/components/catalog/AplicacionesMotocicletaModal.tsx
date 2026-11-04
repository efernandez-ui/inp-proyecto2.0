'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import Modal from '../modals/Modal'
import type { AplicacionDTO } from '@/interfaces/producto'

function norm(s: string | null | undefined) {
    return (s ?? '').toString().trim()
}

function cmpApp(a: AplicacionDTO, b: AplicacionDTO) {
    const keys = ['marca', 'modelo', 'cilindrada', 'version'] as const
    for (const k of keys) {
        const va = norm(a[k]).toLowerCase()
        const vb = norm(b[k]).toLowerCase()
        if (va < vb) return -1
        if (va > vb) return 1
    }
    return 0
}

function appSearchHaystack(a: AplicacionDTO): string {
    return [
        a.marca,
        a.modelo,
        a.version,
        a.cilindrada,
        a.tipoMotor,
        a.adesde,
        a.ahasta,
        a.annios,
    ]
        .map((x) => norm(x))
        .join(' ')
        .toLowerCase()
}

function filterApps(apps: AplicacionDTO[], q: string) {
    const t = q.trim().toLowerCase()
    if (!t) return [...apps]
    return apps.filter((a) => appSearchHaystack(a).includes(t))
}

type RowMeta = {
    app: AplicacionDTO
    marcaRowSpan: number
    modeloRowSpan: number
    cilRowSpan: number
    showMarca: boolean
    showModelo: boolean
    showCil: boolean
}

function buildRowMeta(sorted: AplicacionDTO[]): RowMeta[] {
    const n = sorted.length
    const rows: RowMeta[] = []
    for (let i = 0; i < n; i++) {
        const app = sorted[i]
        const prev = i > 0 ? sorted[i - 1] : null

        const sameMarca = prev && norm(prev.marca) === norm(app.marca)
        const showMarca = !sameMarca
        let marcaRowSpan = 1
        if (showMarca) {
            let j = i + 1
            while (j < n && norm(sorted[j].marca) === norm(app.marca)) j++
            marcaRowSpan = j - i
        }

        const sameModelo =
            prev &&
            norm(prev.marca) === norm(app.marca) &&
            norm(prev.modelo) === norm(app.modelo)
        const showModelo = !sameModelo
        let modeloRowSpan = 1
        if (showModelo) {
            let j = i + 1
            while (
                j < n &&
                norm(sorted[j].marca) === norm(app.marca) &&
                norm(sorted[j].modelo) === norm(app.modelo)
            )
                j++
            modeloRowSpan = j - i
        }

        const sameCil =
            prev &&
            norm(prev.marca) === norm(app.marca) &&
            norm(prev.modelo) === norm(app.modelo) &&
            norm(prev.cilindrada) === norm(app.cilindrada)
        const showCil = !sameCil
        let cilRowSpan = 1
        if (showCil) {
            let j = i + 1
            while (
                j < n &&
                norm(sorted[j].marca) === norm(app.marca) &&
                norm(sorted[j].modelo) === norm(app.modelo) &&
                norm(sorted[j].cilindrada) === norm(app.cilindrada)
            )
                j++
            cilRowSpan = j - i
        }

        rows.push({
            app,
            marcaRowSpan,
            modeloRowSpan,
            cilRowSpan,
            showMarca,
            showModelo,
            showCil,
        })
    }
    return rows
}

function displayCell(v: string | null | undefined) {
    const s = norm(v)
    return s || '—'
}

type Props = {
    isOpen: boolean
    onClose: () => void
    aplicaciones: AplicacionDTO[] | undefined
}

export default function AplicacionesMotocicletaModal({ isOpen, onClose, aplicaciones }: Props) {
    const [query, setQuery] = useState('')

    useEffect(() => {
        if (isOpen) setQuery('')
    }, [isOpen])

    const list = aplicaciones ?? []

    const rowMeta = useMemo(() => {
        const filtered = filterApps(list, query)
        const sorted = [...filtered].sort(cmpApp)
        return buildRowMeta(sorted)
    }, [list, query])

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            contentClassName="w-full max-w-5xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col"
        >
            <div className="flex flex-col flex-1 min-h-0 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Aplicaciones por Motocicleta
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative mb-4 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por marca, modelo o cilindrada..."
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                </div>

                <div className="flex-1 min-h-0 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                    {list.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No hay aplicaciones cargadas para este producto.
                        </div>
                    ) : rowMeta.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No hay resultados para &ldquo;{query.trim()}&rdquo;.
                        </div>
                    ) : (
                        <div className="overflow-auto flex-1 min-h-[200px] max-h-[min(60vh,520px)]">
                            <table className="w-full text-sm border-collapse">
                                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(229,231,235)]">
                                    <tr>
                                        {(['MARCA', 'MODELO', 'CILINDRADA', 'VERSIÓN', 'DESDE', 'HASTA'] as const).map(
                                            (h) => (
                                                <th
                                                    key={h}
                                                    className="text-center font-bold text-gray-600 uppercase text-xs tracking-wide px-3 py-3 border-b border-gray-200 bg-gray-50/95 backdrop-blur-sm"
                                                >
                                                    {h}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rowMeta.map((row, idx) => {
                                        const { app } = row
                                        return (
                                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/80">
                                                {row.showMarca && (
                                                    <td
                                                        rowSpan={row.marcaRowSpan}
                                                        className="align-middle text-center px-3 py-2.5 text-gray-900 font-medium border-r border-gray-100"
                                                    >
                                                        {displayCell(app.marca)}
                                                    </td>
                                                )}
                                                {row.showModelo && (
                                                    <td
                                                        rowSpan={row.modeloRowSpan}
                                                        className="align-middle text-center px-3 py-2.5 text-gray-800 border-r border-gray-100"
                                                    >
                                                        {displayCell(app.modelo)}
                                                    </td>
                                                )}
                                                {row.showCil && (
                                                    <td
                                                        rowSpan={row.cilRowSpan}
                                                        className="align-middle text-center px-3 py-2.5 text-gray-800 border-r border-gray-100"
                                                    >
                                                        {displayCell(app.cilindrada)}
                                                    </td>
                                                )}
                                                <td className="align-middle text-center px-3 py-2.5 text-gray-800 border-r border-gray-100">
                                                    {displayCell(app.version)}
                                                </td>
                                                <td className="align-middle text-center px-3 py-2.5 text-gray-800 tabular-nums">
                                                    {displayCell(app.adesde)}
                                                </td>
                                                <td className="align-middle text-center px-3 py-2.5 text-gray-800 tabular-nums">
                                                    {displayCell(app.ahasta)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}
