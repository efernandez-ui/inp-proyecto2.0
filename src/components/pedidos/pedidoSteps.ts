import {
  FileText,
  Search,
  PackageOpen,
  Receipt,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import type { PedidoCircomInstancia, PedidoEtapa } from '@/services/pedidos';

export const PEDIDO_TEAL = '#0e8c85';
/** Brand blue for stepper / CTAs (inp-proyecto). */
export const PEDIDO_BRAND = '#1a79ff';
export const PEDIDO_BRAND_DARK = '#001f3f';

/** Pasos del stepper = instancias Softland consultables. */
export const PEDIDO_STEPS: {
  key: PedidoInstanciaStep;
  label: string;
  icon: LucideIcon;
  circom: PedidoCircomInstancia;
}[] = [
  { key: 'RECIBIDO', label: 'Pedido Recibido', icon: FileText, circom: 'PRESUPUESTO' },
  { key: 'ANALISIS', label: 'Pedido en análisis', icon: Search, circom: 'ANALISIS' },
  { key: 'PREPARACION', label: 'En Preparación', icon: PackageOpen, circom: 'PREPARACION' },
  { key: 'FACTURADO', label: 'Facturado', icon: Receipt, circom: 'FACTURADO' },
  { key: 'ENVIADO', label: 'Enviado', icon: Truck, circom: 'FACTURADO' },
];

export type PedidoInstanciaStep =
  | 'RECIBIDO'
  | 'ANALISIS'
  | 'PREPARACION'
  | 'FACTURADO'
  | 'ENVIADO';

export function stepToCircom(step: PedidoInstanciaStep): PedidoCircomInstancia {
  return PEDIDO_STEPS.find((s) => s.key === step)?.circom ?? 'PRESUPUESTO';
}

export function instanciaStepLabel(step: PedidoInstanciaStep): string {
  return PEDIDO_STEPS.find((s) => s.key === step)?.label ?? step;
}

export function defaultInstanciaStep(etapa: PedidoEtapa): PedidoInstanciaStep {
  if (
    etapa === 'RECIBIDO'
    || etapa === 'ANALISIS'
    || etapa === 'PREPARACION'
    || etapa === 'FACTURADO'
    || etapa === 'ENVIADO'
  ) {
    return etapa;
  }
  return 'RECIBIDO';
}

export function currentStepIndex(etapa: PedidoEtapa): number {
  if (etapa === 'CANCELADO') return -1;
  return PEDIDO_STEPS.findIndex((s) => s.key === etapa);
}
