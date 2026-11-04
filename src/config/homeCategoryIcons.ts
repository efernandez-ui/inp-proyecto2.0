export type HomeCategory = {
  label: string;
  iconSrc: string;
};

/** Categorías fijas de la home (orden y diseño legacy). */
export const HOME_CATEGORIES: HomeCategory[] = [
  { label: 'Baterias', iconSrc: '/Iconos/Bateria.svg' },
  { label: 'Bujias', iconSrc: '/Iconos/Bujia.svg' },
  { label: 'Cables', iconSrc: '/Iconos/Cables.svg' },
  { label: 'Camaras', iconSrc: '/Iconos/Camaras.svg' },
  { label: 'Cubiertas', iconSrc: '/Iconos/Cubiertas.svg' },
  { label: 'Electronica', iconSrc: '/Iconos/Electronica.svg' },
  { label: 'Lubricantes', iconSrc: '/Iconos/Lubricantes.svg' },
  { label: 'Partes motor', iconSrc: '/Iconos/Partes_motor.svg' },
  { label: 'Transmision', iconSrc: '/Iconos/Transmision.svg' },
];

export function normalizeCategoryKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '');
}

/** Usa el texto exacto del rubro en API para el filtro de catálogo. */
export function resolveRubroLabel(
  configLabel: string,
  tipos: { label: string }[],
): string {
  const key = normalizeCategoryKey(configLabel);
  const exact = tipos.find((t) => normalizeCategoryKey(t.label) === key);
  if (exact) return exact.label;

  const partial = tipos.find((t) => {
    const tipoKey = normalizeCategoryKey(t.label);
    return tipoKey.includes(key) || key.includes(tipoKey);
  });
  return partial?.label ?? configLabel;
}

export function catalogTipoHref(label: string): string {
  return `/catalogo?tipo=${encodeURIComponent(label)}`;
}
