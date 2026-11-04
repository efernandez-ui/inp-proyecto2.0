/** Producto marcado como novedad en catálogo (USR_STMPDH / ES `nuevo`). */
export function isProductoNuevo(nuevo?: string | null): boolean {
  return (nuevo ?? '').trim().toUpperCase() === 'S';
}
