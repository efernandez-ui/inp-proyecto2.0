/** Indica si un link del navbar corresponde a la ruta actual. */
export function isNavLinkActive(pathname: string, href: string): boolean {
  if (!href || href === '#') return false;

  const path = pathname || '/';
  const base = href.split('?')[0];

  if (base === '/') return path === '/';
  if (base === '/catalogo') {
    return path === '/catalogo' || path.startsWith('/catalogo/');
  }

  return path === base || path.startsWith(`${base}/`);
}

export function isCatalogNavActive(pathname: string): boolean {
  return isNavLinkActive(pathname, '/catalogo');
}

export function isHomeNavActive(pathname: string): boolean {
  return pathname === '/' || pathname === '';
}
