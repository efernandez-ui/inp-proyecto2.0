import type { TarjetaCoeficiente } from '@/services/tarjetasCoeficientes';

export interface InpayTerminal {
  id: string;
  label: string;
  logo: string;
  matchTarjeta: (tarjeta: string) => boolean;
}

/** Logo principal INPay (sección Cobrá con INPay). */
export const INPAY_BRAND_LOGO = '/images/inpay/inpay.svg';

/**
 * Reglas de terminal por nombre de tarjeta (GRCCOH_DESCRP).
 * Validado contra legacy: "Mercado Pago INPAY" es MP; Clover/Fiserv el resto de POS físico.
 */
export const INPAY_TERMINALS: InpayTerminal[] = [
  {
    id: 'mercadopago',
    label: '',
    logo: '/images/inpay/mercadopoint.svg',
    matchTarjeta: (t) => /mercado\s*pago|inpay/i.test(t),
  },
  {
    id: 'clover',
    label: '',
    logo: '/images/inpay/clover.svg',
    // Planes POS físico: todo lo que no es Mercado Pago / INPAY (validado contra COEFICIENTES_TARJETAS).
    matchTarjeta: (t) => !/mercado\s*pago|inpay/i.test(t),
  },
];

export function filterCoeficientesByTerminal(
  coeficientes: TarjetaCoeficiente[],
  terminalId: string,
): TarjetaCoeficiente[] {
  const terminal = INPAY_TERMINALS.find((t) => t.id === terminalId);
  if (!terminal) return coeficientes;
  return coeficientes.filter((c) => terminal.matchTarjeta(c.tarjeta ?? ''));
}

export function getDefaultTerminalId(coeficientes: TarjetaCoeficiente[]): string {
  for (const terminal of INPAY_TERMINALS) {
    if (coeficientes.some((c) => terminal.matchTarjeta(c.tarjeta ?? ''))) {
      return terminal.id;
    }
  }
  return INPAY_TERMINALS[0].id;
}
