/**
 * V, A, S, B (legacy). Incluye fallback por `descripcionTipo` por si el DTO/BD devuelve texto ("Usuario Sitio") en `tipo`.
 */
export const isStaff = (u: any) => {
  if (!u) return false;
  const t = (u.tipo != null ? String(u.tipo) : '').trim().toUpperCase();
  if (t === 'V' || t === 'A' || t === 'S' || t === 'B') return true;
  const d = (u.descripcionTipo != null ? String(u.descripcionTipo) : '').trim().toLowerCase();
  if (d === 'usuario sitio' || d === 'vendedor' || d === 'administrador' || d === 'sai') return true;
  return false;
};

/** Administrador del sistema (tipo A). */
export const isAdmin = (u: any) => {
  if (!u) return false;
  return (u.tipo != null ? String(u.tipo) : '').trim().toUpperCase() === 'A';
};

/** Vendedor comercial (tipo V). */
export const isVendedor = (u: any) => {
  if (!u) return false;
  const t = (u.tipo != null ? String(u.tipo) : '').trim().toUpperCase();
  if (t === 'V') return true;
  const d = (u.descripcionTipo != null ? String(u.descripcionTipo) : '').trim().toLowerCase();
  return d === 'vendedor';
};

/** Acceso al Panel (admin A o vendedor V): ventas especiales / shell admin. */
export const canAccessPanel = (u: any) => isAdmin(u) || isVendedor(u);

/** C/P clientes y staff (V/B/S/A) pueden consultar cuenta corriente. */
export const canAccessCuentaCorriente = (u: any) => {
  if (!u) return false;
  const t = (u.tipo != null ? String(u.tipo) : '').trim().toUpperCase();
  return t === 'C' || t === 'P' || isStaff(u);
};

/** Cliente final (no comercial/staff): enlace en header público. */
export const showCuentaCorrienteInNavbar = (u: any) =>
  canAccessCuentaCorriente(u) && !isStaff(u);
