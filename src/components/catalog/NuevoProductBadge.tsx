'use client'

type Size = 'card' | 'list' | 'detail'

type Props = {
  visible: boolean
  size?: Size
}

const sizeStyles: Record<Size, { text: string; pad: string }> = {
  card: {
    text: 'text-[10px]',
    pad: 'px-2.5 py-0.5',
  },
  list: {
    text: 'text-[10px]',
    pad: 'px-2 py-0.5',
  },
  detail: {
    text: 'text-xs',
    pad: 'px-3 py-0.5',
  },
}

/** Badge inline "NUEVO" cuando `nuevo === 'S'` — fondo/color alternando. */
export default function NuevoProductBadge({ visible, size = 'card' }: Props) {
  if (!visible) return null

  const s = sizeStyles[size]

  return (
    <span
      className={`inline-flex animate-nuevo-badge rounded-full border-2 border-[#0e8c85] font-black uppercase tracking-widest shadow-sm ${s.text} ${s.pad}`}
      aria-label="Producto nuevo"
    >
      NUEVO
    </span>
  )
}
