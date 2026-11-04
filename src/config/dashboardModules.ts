import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  Mail,
  MapPin,
  MessageSquareWarning,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { canAccessCuentaCorriente, canAccessPanel, isStaff } from '@/utils/auth';

export type DashboardGroupId =
  | 'compras'
  | 'cuenta'
  | 'autogestion'
  | 'operacion'
  | 'admin';

export type DashboardModuleStatus = 'live' | 'soon';

export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  status: DashboardModuleStatus;
  group: DashboardGroupId;
}

export const DASHBOARD_GROUP_LABELS: Record<DashboardGroupId, string> = {
  compras: 'Compras',
  cuenta: 'Cuenta',
  autogestion: 'Autogestión',
  operacion: 'Operación',
  admin: 'Admin',
};

const GROUP_ORDER: DashboardGroupId[] = [
  'compras',
  'cuenta',
  'autogestion',
  'operacion',
  'admin',
];

type UserLike = {
  tipo?: string | null;
  descripcionTipo?: string | null;
} | null | undefined;

function tipoOf(user: UserLike): string {
  return (user?.tipo != null ? String(user.tipo) : '').trim().toUpperCase();
}

function isAdmin(user: UserLike): boolean {
  return tipoOf(user) === 'A';
}

function isClient(user: UserLike): boolean {
  const t = tipoOf(user);
  return t === 'C' || t === 'P';
}

/** Módulos visibles según tipo de usuario. */
export function getDashboardModules(user: UserLike): DashboardModule[] {
  const modules: DashboardModule[] = [];

  // Compras — todos los logueados
  modules.push({
    id: 'catalogo',
    title: 'Catálogo',
    description: 'Explorá productos, precios y stock disponible.',
    href: '/catalogo',
    icon: BookOpen,
    status: 'live',
    group: 'compras',
  });

  modules.push({
    id: 'carritos',
    title: isStaff(user) ? 'Carritos' : 'Mis carritos',
    description: isStaff(user)
      ? 'Gestioná carritos del cliente seleccionado.'
      : 'Revisá y confirmá tus carritos pendientes.',
    href: '/carrito',
    icon: ShoppingCart,
    status: 'live',
    group: 'compras',
  });

  if (isClient(user)) {
    modules.push({
      id: 'mis-compras',
      title: 'Mis compras',
      description: 'Consulta de pedidos y seguimiento de compras.',
      href: '/pedidos',
      icon: ClipboardList,
      status: 'live',
      group: 'compras',
    });
  }

  if (isStaff(user) && !isAdmin(user)) {
    modules.push({
      id: 'consulta-pedidos',
      title: 'Consulta pedidos',
      description: 'Consultá pedidos de clientes de tu cartera.',
      href: '/pedidos',
      icon: ClipboardList,
      status: 'live',
      group: 'compras',
    });
  }

  if (isClient(user)) {
    modules.push({
      id: 'ventas-especiales-user',
      title: 'Ventas especiales',
      description: 'Promociones y estrategias comerciales disponibles.',
      icon: Sparkles,
      status: 'soon',
      group: 'compras',
    });
  }

  // Vendedor (V): acceso al panel de ventas especiales (mismo que admin, sin parámetros)
  if (canAccessPanel(user) && !isAdmin(user)) {
    modules.push({
      id: 'ventas-especiales-vendedor',
      title: 'Ventas especiales',
      description: 'Resumen y gestión de estrategias y campañas especiales.',
      href: '/admin/ventas-especiales',
      icon: ShoppingBag,
      status: 'live',
      group: 'admin',
    });
  }

  // Cuenta
  if (canAccessCuentaCorriente(user)) {
    modules.push({
      id: 'cuenta-corriente',
      title: 'Cuenta corriente',
      description: isStaff(user)
        ? 'Estado de cuenta del cliente seleccionado.'
        : 'Saldos, pendientes, historial y descargas.',
      href: '/cuenta-corriente',
      icon: Wallet,
      status: 'live',
      group: 'cuenta',
    });
    modules.push({
      id: 'cobra-inpay',
      title: 'Cobrá con INPay',
      description: 'Simulador de ventas y coeficientes por terminal.',
      href: '/cobra-con-inpay',
      icon: CreditCard,
      status: 'live',
      group: 'cuenta',
    });
  }

  // Autogestión
  if (isClient(user)) {
    modules.push({
      id: 'sugerencia-reclamo',
      title: 'Sugerencia / reclamo',
      description: 'Enviá sugerencias o reclamos al equipo.',
      icon: MessageSquareWarning,
      status: 'soon',
      group: 'autogestion',
    });
  }

  if (isStaff(user) && !isAdmin(user)) {
    modules.push({
      id: 'autogestion-staff',
      title: 'Autogestión',
      description: 'Sugerencias, consultas y trámites del vendedor.',
      icon: MessageSquareWarning,
      status: 'soon',
      group: 'autogestion',
    });
  }

  // Operación (staff no-admin)
  if (isStaff(user) && !isAdmin(user)) {
    modules.push({
      id: 'visitas',
      title: 'Visitas / Solicitud atención',
      description: 'Gestión de visitas y solicitudes de atención.',
      icon: MapPin,
      status: 'soon',
      group: 'operacion',
    });
  }

  // Admin
  if (isAdmin(user)) {
    modules.push(
      {
        id: 'parametros',
        title: 'Parámetros',
        description: 'Configuración general de la tienda virtual.',
        href: '/admin/parametros',
        icon: Settings,
        status: 'live',
        group: 'admin',
      },
      {
        id: 'ventas-especiales-admin',
        title: 'Ventas especiales',
        description: 'Resumen y gestión de estrategias y campañas especiales.',
        href: '/admin/ventas-especiales',
        icon: ShoppingBag,
        status: 'live',
        group: 'admin',
      },
      {
        id: 'correos-no-enviados',
        title: 'Correos no enviados',
        description: 'Revisión de correos pendientes de envío.',
        icon: Mail,
        status: 'soon',
        group: 'admin',
      },
    );
  }

  return modules;
}

export function getDashboardGroups(
  modules: DashboardModule[],
): { id: DashboardGroupId; label: string; modules: DashboardModule[] }[] {
  return GROUP_ORDER.map((id) => ({
    id,
    label: DASHBOARD_GROUP_LABELS[id],
    modules: modules.filter((m) => m.group === id),
  })).filter((g) => g.modules.length > 0);
}
