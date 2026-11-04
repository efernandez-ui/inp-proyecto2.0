import { describe, expect, it } from 'vitest';
import {
  parseCantidadCuotas,
  simularVenta,
  type TarjetaPlanCalculo,
} from './tarjetasCoeficienteCalc';

const mpPlan12: TarjetaPlanCalculo = {
  comision: 4.4,
  coeficienteFinanciero: 1.46,
  multiploTotal: 1.5602,
  multiploTotalConIva: 1.7683,
  plan: '12 Cuotas s/inter',
  cuotas: '12',
};

describe('parseCantidadCuotas', () => {
  it('lee cuotas desde campo BD', () => {
    expect(parseCantidadCuotas({ cuotas: '12' })).toBe(12);
  });

  it('lee cuotas desde descripción del plan', () => {
    expect(parseCantidadCuotas({ plan: '12 Cuotas s/inter' })).toBe(12);
  });

  it('lee cuotas desde código de plan', () => {
    expect(parseCantidadCuotas({ codigoPlan: '6' })).toBe(6);
  });
});

describe('simularVenta', () => {
  it('Me tomo IVA = No: importe con múltiplo G6 (MP 12 cuotas, 1000)', () => {
    const result = simularVenta(1000, mpPlan12, { meTomoIva: false });
    expect(result.multiploAplicado).toBe(1.7683);
    expect(result.importeFinal).toBe(1768.3);
    expect(result.cantidadCuotas).toBe(12);
    expect(result.importePorCuota).toBe(147.36);
    expect(result.ivaCreditoFiscal).toBe(0);
  });

  it('Me tomo IVA = Sí: importe con múltiplo F6 (MP 12 cuotas, 1000)', () => {
    const result = simularVenta(1000, mpPlan12, { meTomoIva: true });
    expect(result.multiploAplicado).toBe(1.5602);
    expect(result.importeFinal).toBe(1560.2);
    expect(result.cantidadCuotas).toBe(12);
    expect(result.importePorCuota).toBe(130.02);
    expect(result.ivaCreditoFiscal).toBe(117.65);
  });

  it('calcula múltiplos desde coeficiente y comisión si no vienen del API', () => {
    const plan: TarjetaPlanCalculo = {
      comision: 4.4,
      coeficienteFinanciero: 1.46,
      cuotas: '12',
    };
    const sinIva = simularVenta(1000, plan, { meTomoIva: false });
    const conIva = simularVenta(1000, plan, { meTomoIva: true });
    expect(sinIva.multiploAplicado).toBe(1.7682);
    expect(conIva.multiploAplicado).toBe(1.5602);
    expect(sinIva.importeFinal).toBe(1768.2);
    expect(conIva.importeFinal).toBe(1560.2);
  });
});
