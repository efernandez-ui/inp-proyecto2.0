'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  BANCO_LABELS,
  FORMA_PAGO_LABELS,
  fetchInformesPago,
  type InformePagoListItem,
} from '@/services/informesPago';
import { formatCurrency } from '@/services/cuentaCorriente';

interface Props {
  token: string;
  nrocta?: string;
}

export default function InformesPagoTab({ token, nrocta }: Props) {
  const [informes, setInformes] = useState<InformePagoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchInformesPago(token, nrocta);
        setInformes(data);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error al cargar informes');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, nrocta]);

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="py-8 text-center text-gray-500">Cargando informes...</p>
      ) : informes.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No hay informes de pago registrados</p>
      ) : (
        informes.map((inf) => (
          <div key={`${inf.nroCuenta}-${inf.fechaInforme}-${inf.nroVersion}`} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Informe</p>
                <p className="font-bold text-[#001f3f]">
                  {inf.fechaInforme} · Versión {inf.nroVersion}
                </p>
              </div>
              {inf.notas && <p className="text-sm text-gray-600">{inf.notas}</p>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-[#001f3f]">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <th className="pb-2 pr-4">Nº transferencia</th>
                    <th className="pb-2 pr-4">Fecha</th>
                    <th className="pb-2 pr-4">Banco</th>
                    <th className="pb-2 pr-4">Tipo</th>
                    <th className="pb-2 pr-4">Estado</th>
                    <th className="pb-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(inf.pagos ?? []).map((p, idx) => (
                    <tr key={`${p.nroComprobante}-${idx}`}>
                      <td className="py-2 pr-4 font-medium">{p.nroComprobante}</td>
                      <td className="py-2 pr-4">{p.fechaComprobante}</td>
                      <td className="py-2 pr-4">{BANCO_LABELS[p.bancoDestino] ?? p.bancoDestino}</td>
                      <td className="py-2 pr-4">{FORMA_PAGO_LABELS[p.formaPago] ?? p.formaPago}</td>
                      <td className="py-2 pr-4">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                          {p.estado ?? 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-2 text-right font-bold">{formatCurrency(p.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
