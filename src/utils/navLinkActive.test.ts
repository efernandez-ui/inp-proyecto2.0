import { describe, expect, it } from 'vitest';
import { isCatalogNavActive, isHomeNavActive, isNavLinkActive } from './navLinkActive';

describe('isNavLinkActive', () => {
  it('detecta home', () => {
    expect(isHomeNavActive('/')).toBe(true);
    expect(isHomeNavActive('/catalogo')).toBe(false);
  });

  it('detecta catálogo', () => {
    expect(isCatalogNavActive('/catalogo')).toBe(true);
    expect(isCatalogNavActive('/catalogo?q=test')).toBe(false);
    expect(isNavLinkActive('/catalogo', '/catalogo')).toBe(true);
  });

  it('detecta rutas anidadas', () => {
    expect(isNavLinkActive('/admin/parametros', '/admin')).toBe(true);
    expect(isNavLinkActive('/cobra-con-inpay', '/cobra-con-inpay')).toBe(true);
    expect(isNavLinkActive('/carrito', '/carritos')).toBe(false);
    expect(isNavLinkActive('/pedidos', '/pedidos')).toBe(true);
    expect(isNavLinkActive('/pedidos', '/carrito')).toBe(false);
    expect(isNavLinkActive('/carritos', '/pedidos')).toBe(false);
  });
});
