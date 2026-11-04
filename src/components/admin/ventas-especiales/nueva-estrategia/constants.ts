import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  CreditCard,
  Layers,
  MapPinned,
  Package,
  Percent,
  Rocket,
  Sun,
  Tags,
  Zap,
} from 'lucide-react';

export const NUEVA_ESTRATEGIA_MINT = '#2dd4a3';
export const NUEVA_ESTRATEGIA_NAVY = '#001f3f';

export const NUEVA_ESTRATEGIA_STEPS = ['Estrategia', 'Productos', 'Vigencia', 'Segmentación'] as const;

export type NuevaEstrategiaStepLabel = (typeof NUEVA_ESTRATEGIA_STEPS)[number];

/** Iconos decorativos para la grilla de tipos (sin semántica de negocio). */
export const TIPO_OFERTA_CARD_ICONS = [
  Layers,
  Zap,
  Rocket,
  MapPinned,
  CalendarDays,
  Sun,
  CreditCard,
  Percent,
  Tags,
  Package,
] as const satisfies readonly LucideIcon[];
