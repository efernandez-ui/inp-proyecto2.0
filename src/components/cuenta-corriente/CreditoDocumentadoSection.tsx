'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  fetchValoresEnCartera,
  fetchValoresEntregados,
  formatChequeNumero,
  formatCurrency,
  formatVencimientoIso,
  sumImportes,
  type ValorEnCartera,
} from '@/services/cuentaCorriente';

interface Props {
  token: string;
  nrocta?: string;
  /** Staff: muestra etiquetas Cartera / Entregados. Clientes: lista unificada sin esos textos. */
  mostrarOrigenComercial?: boolean;
}

type ValorRow = ValorEnCartera & { tipo: 'CARTERA' | 'ENTREGADOS' };

function tipoLabel(tipo: ValorRow['tipo']): string {
  return tipo === 'ENTREGADOS' ? 'Entregados' : 'Cartera';
}

export default function CreditoDocumentadoSection({
  token,
  nrocta,
  mostrarOrigenComercial = false,
}: Props) {
  const [open, setOpen] = useState(true);
  const [cartera, setCartera] = useState<ValorEnCartera[]>([]);
  const [entregados, setEntregados] = useState<ValorEnCartera[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setCartera([]);
      setEntregados([]);
      try {
        // Cartera primero (query liviana). Entregados después: la query original es pesada
        // y en paralelo contiende sobre CJRMVI.
        const carteraData = await fetchValoresEnCartera(token, nrocta);
        if (cancelled) return;
        setCartera(carteraData);
        setLoading(false);

        try {
          const entregadosData = await fetchValoresEntregados(token, nrocta);
          if (cancelled) return;
          setEntregados(entregadosData);
        } catch {
          if (cancelled) return;
          setEntregados([]);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        toast.error(e instanceof Error ? e.message : 'Error al cargar crédito documentado');
        setCartera([]);
        setEntregados([]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, nrocta]);

  const items = useMemo<ValorRow[]>(() => {
    const rows: ValorRow[] = [
      ...cartera.map((i) => ({ ...i, tipo: 'CARTERA' as const })),
      ...entregados.map((i) => ({ ...i, tipo: 'ENTREGADOS' as const })),
    ];
    rows.sort((a, b) => String(a.vencimiento || '').localeCompare(String(b.vencimiento || '')));
    return rows;
  }, [cartera, entregados]);

  const totalCartera = useMemo(() => sumImportes(cartera), [cartera]);
  const totalEntregados = useMemo(() => sumImportes(entregados), [entregados]);
  const total = totalCartera + totalEntregados;
  const colSpanTotal = mostrarOrigenComercial ? 5 : 4;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50/80"
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <Wallet className="h-5 w-5 shrink-0 text-[#0e8c85]" aria-hidden />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#001f3f]">
            Crédito documentado
          </span>
        </span>
        {!loading && (
          <span className="hidden shrink-0 flex-wrap items-center justify-end gap-2 sm:flex">
            {mostrarOrigenComercial && (
              <>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#0e8c85]">
                  Cartera {formatCurrency(totalCartera)}
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-sky-700">
                  Entregados {formatCurrency(totalEntregados)}
                </span>
              </>
            )}
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#001f3f]">
              Total {formatCurrency(total)}
            </span>
          </span>
        )}
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {!loading && (
        <div
          className={`border-t border-gray-100 px-5 py-3 sm:hidden ${
            mostrarOrigenComercial ? 'grid grid-cols-3 gap-3' : 'flex justify-end'
          }`}
        >
          {mostrarOrigenComercial ? (
            <>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Cartera</p>
                <p className="mt-0.5 text-sm font-black text-[#0e8c85]">{formatCurrency(totalCartera)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Entregados</p>
                <p className="mt-0.5 text-sm font-black text-sky-700">{formatCurrency(totalEntregados)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total</p>
                <p className="mt-0.5 text-sm font-black text-[#001f3f]">{formatCurrency(total)}</p>
              </div>
            </>
          ) : (
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total</p>
              <p className="mt-0.5 text-sm font-black text-[#001f3f]">{formatCurrency(total)}</p>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5">
          {loading ? (
            <p className="py-6 text-center text-sm text-gray-500">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              {mostrarOrigenComercial
                ? 'No hay valores en cartera ni entregados'
                : 'No hay valores'}
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm text-[#001f3f]">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <th className="pb-3 pr-4 pt-3">Fecha vto.</th>
                    {mostrarOrigenComercial && <th className="pb-3 pr-4 pt-3">Origen</th>}
                    <th className="pb-3 pr-4 pt-3">Tipo</th>
                    <th className="pb-3 pr-4 pt-3">Banco</th>
                    <th className="pb-3 pr-4 pt-3">Nº</th>
                    <th className="pb-3 pt-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={`${item.tipo}-${item.numero}-${item.vencimiento}-${idx}`}>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {formatVencimientoIso(item.vencimiento)}
                      </td>
                      {mostrarOrigenComercial && (
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              item.tipo === 'ENTREGADOS'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-emerald-50 text-[#0e8c85]'
                            }`}
                          >
                            {tipoLabel(item.tipo)}
                          </span>
                        </td>
                      )}
                      <td className="py-3 pr-4 whitespace-nowrap">{item.categoria}</td>
                      <td className="py-3 pr-4">{item.banco ?? '—'}</td>
                      <td className="py-3 pr-4 font-medium whitespace-nowrap">
                        {formatChequeNumero(item.numero)}
                      </td>
                      <td className="py-3 text-right font-bold whitespace-nowrap">
                        {formatCurrency(item.importe)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td
                      colSpan={colSpanTotal}
                      className="py-3 pr-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500"
                    >
                      Total:
                    </td>
                    <td className="py-3 text-right text-base font-black text-[#001f3f] underline decoration-[#0e8c85]/40 underline-offset-4">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
