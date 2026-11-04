'use client';

import { useCallback, useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { RootState } from '@/store';
import { isStaff } from '@/utils/auth';
import CuentaCorrienteCards from './CuentaCorrienteCards';
import DocumentosPendientesTab from './DocumentosPendientesTab';
import HistorialTab from './HistorialTab';
import InformesPagoTab from './InformesPagoTab';
import CentroDescargasTab from './CentroDescargasTab';
import InformarPagoModal from './InformarPagoModal';
import CreditoDocumentadoSection from './CreditoDocumentadoSection';
import {
  fetchResumen,
  formatCurrency,
  type CuentaCorrienteResumen,
} from '@/services/cuentaCorriente';

type TabId = 'pendientes' | 'historial' | 'informes' | 'descargas';

const TABS: { id: TabId; label: string; requiresInforme?: boolean }[] = [
  { id: 'pendientes', label: 'Importes pendientes' },
  { id: 'historial', label: 'Historial completo' },
  { id: 'informes', label: 'Historial informes pago', requiresInforme: true },
  { id: 'descargas', label: 'Descarga comprobantes' },
];

export default function CuentaCorrienteSection() {
  const { user, selectedClient } = useSelector((s: RootState) => s.auth);
  const [token, setToken] = useState<string | null>(null);
  const [resumen, setResumen] = useState<CuentaCorrienteResumen | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('pendientes');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const staff = isStaff(user);
  const nrocta = staff ? selectedClient?.nrocta : user?.nrocta;
  const needsClient = staff && !nrocta;

  const loadData = useCallback(async (authToken: string, cuenta?: string) => {
    setLoading(true);
    try {
      const res = await fetchResumen(authToken, cuenta);
      setResumen(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar cuenta corriente');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('authToken');
    setToken(t);
    if (!t || needsClient) {
      setLoading(false);
      return;
    }
    loadData(t, nrocta);
  }, [nrocta, needsClient, loadData, refreshKey]);

  if (needsClient) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-sm font-bold text-amber-900">
          Seleccione un cliente para ver el estado de cuenta corriente
        </p>
      </div>
    );
  }

  if (loading && !resumen) {
    return <div className="py-16 text-center text-gray-500">Cargando estado de cuenta...</div>;
  }

  const visibleTabs = TABS.filter((t) => !t.requiresInforme || resumen?.canInformarPago);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
            Administración / Finanzas
          </p>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-[#001f3f]">
            Estado de cuenta
          </h1>
          {resumen && (
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{resumen.clienteNombre}</span>
              {' · '}
              Cuenta {resumen.nrocta}
            </p>
          )}
          {resumen && (
            <p className="mt-3 text-lg">
              <span className="text-gray-600">Saldo actual: </span>
              <span className="font-black text-[#001f3f]">{formatCurrency(resumen.saldoActual)}</span>
              {resumen.saldoActual < 0 && (
                <span className="ml-1 text-sm font-bold text-emerald-600">a favor</span>
              )}
            </p>
          )}
        </div>
        {resumen?.canInformarPago && token && nrocta && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-[#001f3f] px-5 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-lg hover:bg-[#002a55]"
          >
            <Upload className="h-4 w-4" />
            Informar pago
          </button>
        )}
      </div>

      {resumen && <CuentaCorrienteCards resumen={resumen} />}

      {token && nrocta && (
        <CreditoDocumentadoSection
          token={token}
          nrocta={nrocta}
          mostrarOrigenComercial={staff}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-gray-100 bg-gray-50 p-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
                activeTab === tab.id
                  ? 'bg-white text-[#001f3f] shadow-sm'
                  : 'text-gray-500 hover:text-[#001f3f]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4 sm:p-6">
          {activeTab === 'pendientes' && token && (
            <DocumentosPendientesTab
              key={`pend-${nrocta ?? 'self'}`}
              token={token}
              nrocta={nrocta}
              refreshKey={refreshKey}
            />
          )}
          {activeTab === 'historial' && token && (
            <HistorialTab key={`hist-${nrocta ?? 'self'}`} token={token} nrocta={nrocta} />
          )}
          {activeTab === 'informes' && token && resumen?.canInformarPago && (
            <InformesPagoTab key={`inf-${nrocta ?? 'self'}-${refreshKey}`} token={token} nrocta={nrocta} />
          )}
          {activeTab === 'descargas' && token && (
            <CentroDescargasTab key={`desc-${nrocta ?? 'self'}`} token={token} nrocta={nrocta} />
          )}
        </div>
      </div>

      {token && nrocta && (
        <InformarPagoModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          token={token}
          nrocta={nrocta}
          usuarioEmail={user?.correoElectronico}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
