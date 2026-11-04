import { describe, expect, it } from 'vitest';
import {
  computeMetrics,
  mapProductoToItem,
  resolveCostoConIva,
  resolveIvaPct,
} from './productoOfertaMetrics';
import type { ProductoDTO } from '@/interfaces/producto';

describe('resolveIvaPct', () => {
  it('usa 21 por defecto', () => {
    expect(resolveIvaPct(null)).toBe(21);
    expect(resolveIvaPct(undefined)).toBe(21);
    expect(resolveIvaPct(0)).toBe(21);
  });

  it('respeta IVA del producto', () => {
    expect(resolveIvaPct(10.5)).toBe(10.5);
  });
});

describe('resolveCostoConIva', () => {
  it('calcula costo con IVA 21%', () => {
    expect(resolveCostoConIva(71378, 21)).toBeCloseTo(86367.38, 2);
  });

  it('calcula costo con IVA 10.5%', () => {
    expect(resolveCostoConIva(10000, 10.5)).toBeCloseTo(11050, 2);
  });

  it('retorna null si no hay costo', () => {
    expect(resolveCostoConIva(null, 21)).toBeNull();
  });
});

describe('computeMetrics', () => {
  it('cms null si costo es null', () => {
    const result = computeMetrics({ precioLista: 1000, costo: null, dtoPct: 10 });
    expect(result.precioOferta).toBe(900);
    expect(result.cms).toBeNull();
    expect(result.cmPct).toBeNull();
  });
});

describe('mapProductoToItem', () => {
  it('mapea costo con IVA para CM', () => {
    const product = {
      tippro: '002',
      artcod: '001110008',
      descripcion: 'Producto test',
      precioMarcado: 100000,
      precioCosto: 71378,
      iva: 21,
    } as ProductoDTO;

    const item = mapProductoToItem(product, 10);
    expect(item.costo).toBeCloseTo(86367.38, 2);
    expect(item.precioOferta).toBe(90000);
    expect(item.cms).toBeCloseTo(90000 - 86367.38, 2);
  });
});
