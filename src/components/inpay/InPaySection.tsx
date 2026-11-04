'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { RootState } from '@/store';
import {
  filterCoeficientesByTerminal,
  getDefaultTerminalId,
} from '@/config/inpayTerminals';
import {
  fetchCoeficientes,
  planKey,
  type TarjetaCoeficiente,
  type TarjetasCoeficientesResponse,
} from '@/services/tarjetasCoeficientes';
import SimularVentaPanel from './SimularVentaPanel';
import CoeficientesTable from './CoeficientesTable';

export default function InPaySection() {
  const { isLoggedIn } = useSelector((s: RootState) => s.auth);
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<TarjetasCoeficientesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminalId, setTerminalId] = useState('mercadopago');
  const [montoNeto, setMontoNeto] = useState('');
  const [selectedPlanKey, setSelectedPlanKey] = useState('');

  const load = useCallback(async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetchCoeficientes(authToken);
      setData(res);
      const defaultTerminal = getDefaultTerminalId(res.coeficientes);
      setTerminalId(defaultTerminal);
      const plans = filterCoeficientesByTerminal(res.coeficientes, defaultTerminal);
      if (plans[0]) {
        setSelectedPlanKey(planKey(plans[0]));
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar coeficientes INPay');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('authToken');
    setToken(t);
    if (t) load(t);
    else setLoading(false);
  }, [load]);

  const terminalPlans = useMemo(
    () => (data ? filterCoeficientesByTerminal(data.coeficientes, terminalId) : []),
    [data, terminalId],
  );

  useEffect(() => {
    if (terminalPlans.length === 0) {
      setSelectedPlanKey('');
      return;
    }
    const stillValid = terminalPlans.some((p) => planKey(p) === selectedPlanKey);
    if (!stillValid) {
      setSelectedPlanKey(planKey(terminalPlans[0]));
    }
  }, [terminalPlans, selectedPlanKey]);

  const handleSelectPlanFromTable = useCallback((plan: TarjetaCoeficiente) => {
    setSelectedPlanKey(planKey(plan));
    document.getElementById('inpay-simular-venta')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Cargando coeficientes INPay...</div>;
  }

  if (!token || !data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
        No se pudieron cargar los coeficientes.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <div id="inpay-simular-venta">
        <SimularVentaPanel
          coeficientes={data.coeficientes}
          terminalId={terminalId}
          onTerminalChange={setTerminalId}
          montoNeto={montoNeto}
          onMontoNetoChange={setMontoNeto}
          selectedPlanKey={selectedPlanKey}
          onPlanChange={setSelectedPlanKey}
        />
      </div>
      <CoeficientesTable
        coeficientes={data.coeficientes}
        terminalId={terminalId}
        fechaUltimaModificacion={data.fechaUltimaModificacion}
        selectedPlanKey={selectedPlanKey}
        onSelectPlan={handleSelectPlanFromTable}
      />
    </div>
  );
}
