import { describe, expect, it } from 'vitest';
import { INPAY_TERMINALS, filterCoeficientesByTerminal } from './inpayTerminals';
import type { TarjetaCoeficiente } from '../services/tarjetasCoeficientes';

/** Nombres típicos en COEFICIENTES_TARJETAS / GRCCOH (legacy TasasBean). */
const SAMPLE_TARJETAS = [
  'Mercado Pago INPAY',
  'Mercado Pago QR',
  'Visa Crédito',
  'Mastercard Débito',
  'American Express',
  'Clover Visa',
];

function coef(tarjeta: string): TarjetaCoeficiente {
  return {
    nroItem: 1,
    modcpt: 'CJ',
    tipcpt: 'T',
    codcpt: '001',
    tarjeta,
    plan: 'Plan test',
    comision: 4.4,
    coeficienteFinanciero: 1.46,
    multiploTotal: 1.56,
    multiploTotalConIva: 1.768,
    codigoPlan: '12',
  };
}

describe('inpayTerminals', () => {
  it('Mercado Pago e INPAY van a terminal mercadopago', () => {
    const mp = INPAY_TERMINALS.find((t) => t.id === 'mercadopago')!;
    expect(mp.matchTarjeta('Mercado Pago INPAY')).toBe(true);
    expect(mp.matchTarjeta('Mercado Pago QR')).toBe(true);
    expect(mp.matchTarjeta('INPAY Débito')).toBe(true);
    expect(mp.matchTarjeta('Visa Crédito')).toBe(false);
  });

  it('Clover agrupa el resto de tarjetas POS', () => {
    const clover = INPAY_TERMINALS.find((t) => t.id === 'clover')!;
    expect(clover.matchTarjeta('Visa Crédito')).toBe(true);
    expect(clover.matchTarjeta('Mastercard Débito')).toBe(true);
    expect(clover.matchTarjeta('American Express')).toBe(true);
    expect(clover.matchTarjeta('Mercado Pago INPAY')).toBe(false);
  });

  it('partición MP vs resto cubre muestra legacy sin solapamiento', () => {
    const all = SAMPLE_TARJETAS.map(coef);
    const mp = filterCoeficientesByTerminal(all, 'mercadopago');
    const clover = filterCoeficientesByTerminal(all, 'clover');
    expect(mp.map((c) => c.tarjeta)).toEqual(['Mercado Pago INPAY', 'Mercado Pago QR']);
    expect(clover.map((c) => c.tarjeta)).toEqual([
      'Visa Crédito',
      'Mastercard Débito',
      'American Express',
      'Clover Visa',
    ]);
  });
});
