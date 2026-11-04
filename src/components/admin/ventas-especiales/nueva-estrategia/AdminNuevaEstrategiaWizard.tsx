'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { createVentaEspecialWizard, getCondicionesPago, type CondicionPagoOption, type NuevaEstrategiaPayload, type TipoOfertaPool } from '@/services/admin';
import { NuevaEstrategiaBackLink } from './components/NuevaEstrategiaBackLink';
import { NuevaEstrategiaWizardFooter } from './components/NuevaEstrategiaWizardFooter';
import { NuevaEstrategiaWizardPanel } from './components/NuevaEstrategiaWizardPanel';
import { NuevaEstrategiaWizardStepper } from './components/NuevaEstrategiaWizardStepper';
import { NuevoTipoOfertaPoolModal } from './components/NuevoTipoOfertaPoolModal';
import { usePoolTiposOferta } from './hooks/usePoolTiposOferta';
import { NUEVA_ESTRATEGIA_STEPS } from './constants';
import { TipoOfertaPoolStep } from './steps/TipoOfertaPoolStep';
import { ProductosOfertaStep, type OfertaProductoSeleccionado } from './steps/ProductosOfertaStep';
import { SegmentacionStep } from './steps/SegmentacionStep';
import type { SegmentacionFormData } from './segmentacionTypes';
import { VigenciaStep, type VigenciaFormData } from './steps/VigenciaStep';
import { deriveTipfin } from './tipfin';

const EMPTY_VIGENCIA: VigenciaFormData = {
  disdes: '',
  dishas: '',
  descripcion: '',
  observaciones: '',
  pathBanner: '',
  cierrePorStock: true,
  cuentaRegresiva: true,
};

const EMPTY_SEGMENTACION: SegmentacionFormData = {
  clientes: [],
  sucursales: [],
  localidades: [],
};

function parseLocalidadValue(value: string): { codpai: string; codpos: string; jurisd: string | null } {
  const parts = value.split('|');
  if (parts.length < 3) {
    return { codpai: '', codpos: '', jurisd: null };
  }
  const [codpai = '', codpos = '', jurisd = ''] = parts;
  return {
    codpai,
    codpos,
    jurisd: jurisd || null,
  };
}

function isLocalidadValida(loc: { codpai: string; codpos: string; jurisd: string | null }): boolean {
  if (!loc.codpai || !loc.codpos || !loc.jurisd) return false;
  if (loc.codpos.toUpperCase() === 'X' || loc.jurisd.toUpperCase() === 'X') return false;
  return true;
}

const VENTAS_ESPECIALES_LIST_PATH = '/admin/ventas-especiales';

export function AdminNuevaEstrategiaWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [poolthSeleccionado, setPoolthSeleccionado] = useState<string | null>(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState<OfertaProductoSeleccionado[]>([]);
  const [vigencia, setVigencia] = useState<VigenciaFormData>(EMPTY_VIGENCIA);
  const [segmentacion, setSegmentacion] = useState<SegmentacionFormData>(EMPTY_SEGMENTACION);
  const [modalNuevoTipo, setModalNuevoTipo] = useState(false);
  const [savingWizard, setSavingWizard] = useState(false);
  const [condicionesPago, setCondicionesPago] = useState<CondicionPagoOption[]>([]);
  const [loadingCondicionesPago, setLoadingCondicionesPago] = useState(true);
  const [errorCondicionesPago, setErrorCondicionesPago] = useState<string | null>(null);
  const [condicionesPagoSeleccionadas, setCondicionesPagoSeleccionadas] = useState<string[]>([]);

  const { tipos, loading, error, reload } = usePoolTiposOferta();

  useEffect(() => {
    let cancelled = false;
    setLoadingCondicionesPago(true);
    setErrorCondicionesPago(null);
    void getCondicionesPago()
      .then((items) => {
        if (!cancelled) setCondicionesPago(items);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setErrorCondicionesPago(
            e instanceof Error ? e.message : 'No se pudieron cargar las condiciones de pago'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCondicionesPago(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCondicionPago = (cndpag: string) => {
    setCondicionesPagoSeleccionadas((prev) =>
      prev.includes(cndpag) ? prev.filter((c) => c !== cndpag) : [...prev, cndpag]
    );
  };

  const vigenciaValida = useMemo(() => {
    if (!vigencia.disdes || !vigencia.dishas) return false;
    if (!vigencia.descripcion.trim()) return false;
    const desde = new Date(vigencia.disdes);
    const hasta = new Date(vigencia.dishas);
    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return false;
    return desde.getTime() <= hasta.getTime();
  }, [vigencia.disdes, vigencia.dishas, vigencia.descripcion]);

  const puedeContinuar = useMemo(() => {
    if (stepIndex === 0) {
      return poolthSeleccionado != null && condicionesPagoSeleccionadas.length >= 1;
    }
    if (stepIndex === 1) return productosSeleccionados.length > 0;
    if (stepIndex === 2) return vigenciaValida;
    return true;
  }, [stepIndex, poolthSeleccionado, condicionesPagoSeleccionadas.length, productosSeleccionados.length, vigenciaValida]);

  const tituloTipoSeleccionado = useMemo(() => {
    if (!poolthSeleccionado) return '';
    const t = tipos.find((x) => x.codigo === poolthSeleccionado);
    if (!t) return poolthSeleccionado;
    return (t.descripcion && t.descripcion.trim()) || t.codigo;
  }, [poolthSeleccionado, tipos]);

  const poolthResumen =
    poolthSeleccionado != null ? `${poolthSeleccionado} — ${tituloTipoSeleccionado}` : null;
  const productosResumen = `${productosSeleccionados.length} producto${productosSeleccionados.length === 1 ? '' : 's'}`;

  const wizardPayload = useMemo(
    () => ({
      poolth: poolthSeleccionado,
      tipfin: deriveTipfin(vigencia.cierrePorStock, vigencia.cuentaRegresiva),
      condicionesPago: condicionesPagoSeleccionadas,
      vigencia: {
        disdes: vigencia.disdes || null,
        dishas: vigencia.dishas || null,
        descrp: vigencia.descripcion || null,
        textos: vigencia.observaciones || null,
        pathia: null,
        pathib: vigencia.pathBanner || null,
        pathic: null,
        pathfc: null,
      },
      productos: productosSeleccionados.map((p) => ({
        tippro: p.tippro,
        artcod: p.artcod,
        stockOferta: p.stockOferta,
        dtoPct: p.dtoPct,
        precioOferta: p.precioOferta,
        precioLista: p.precioLista,
        precioCosto: p.costo,
      })),
      segmentacion: {
        clientes: segmentacion.clientes.map((c) => ({ nrocta: c.nrocta })),
        sucursales: segmentacion.sucursales.map((sitios) => ({ sitios })),
        localidades: segmentacion.localidades
          .map((value) => parseLocalidadValue(value))
          .filter(isLocalidadValida),
      },
    }),
    [poolthSeleccionado, condicionesPagoSeleccionadas, productosSeleccionados, segmentacion, vigencia]
  );

  const handleFinalizar = async () => {
    if (savingWizard) return;
    try {
      setSavingWizard(true);
      const payload = wizardPayload as NuevaEstrategiaPayload;
      const saved = await createVentaEspecialWizard(payload);
      toast.success(
        `Oferta B2B publicada correctamente. NRPOOL ${saved.nroPool}.`,
        {
          autoClose: 3500,
          theme: 'colored',
        }
      );
      router.push(VENTAS_ESPECIALES_LIST_PATH);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar la oferta.');
    } finally {
      setSavingWizard(false);
    }
  };
  const hasUnsavedProgress = useMemo(
    () =>
      stepIndex > 0 ||
      poolthSeleccionado != null ||
      condicionesPagoSeleccionadas.length > 0 ||
      productosSeleccionados.length > 0 ||
      vigencia.disdes.length > 0 ||
      vigencia.dishas.length > 0 ||
      vigencia.descripcion.length > 0 ||
      vigencia.observaciones.length > 0 ||
      vigencia.pathBanner.length > 0 ||
      segmentacion.clientes.length > 0 ||
      segmentacion.sucursales.length > 0 ||
      segmentacion.localidades.length > 0,
    [stepIndex, poolthSeleccionado, condicionesPagoSeleccionadas.length, productosSeleccionados.length, segmentacion, vigencia]
  );

  useEffect(() => {
    if (!hasUnsavedProgress) return;

    const warningMessage = 'Tenés cambios sin guardar en la nueva estrategia. ¿Querés salir igualmente?';

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = warningMessage;
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      const destination = new URL(anchor.href, window.location.origin);
      const current = new URL(window.location.href);
      const isSamePage = destination.pathname === current.pathname && destination.search === current.search;
      if (isSamePage) return;

      const confirmed = window.confirm(warningMessage);
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [hasUnsavedProgress]);

  const siguiente = () => {
    if (!puedeContinuar) return;
    setStepIndex((s) => Math.min(NUEVA_ESTRATEGIA_STEPS.length - 1, s + 1));
  };

  const anterior = () => setStepIndex((s) => Math.max(0, s - 1));

  const handleTipoCreated = (created: TipoOfertaPool) => {
    setModalNuevoTipo(false);
    void reload().then(() => setPoolthSeleccionado(created.codigo));
  };

  return (
    <div className="space-y-6">
      <NuevaEstrategiaBackLink />
      <NuevaEstrategiaWizardStepper stepIndex={stepIndex} onStepChange={setStepIndex} />

      <NuevaEstrategiaWizardPanel>
        {stepIndex === 0 ? (
          <TipoOfertaPoolStep
            tipos={tipos}
            loading={loading}
            error={error}
            selectedCodigo={poolthSeleccionado}
            onSelectCodigo={setPoolthSeleccionado}
            onOpenNuevoTipo={() => setModalNuevoTipo(true)}
            condicionesPago={condicionesPago}
            loadingCondicionesPago={loadingCondicionesPago}
            errorCondicionesPago={errorCondicionesPago}
            condicionesPagoSeleccionadas={condicionesPagoSeleccionadas}
            onToggleCondicionPago={toggleCondicionPago}
          />
        ) : null}

        {stepIndex === 1 ? (
          <ProductosOfertaStep
            selectedItems={productosSeleccionados}
            onChangeSelectedItems={setProductosSeleccionados}
          />
        ) : null}
        {stepIndex === 2 ? (
          <VigenciaStep value={vigencia} onChange={setVigencia} />
        ) : null}
        {stepIndex === 3 ? (
          <SegmentacionStep
            value={segmentacion}
            onChange={setSegmentacion}
            productosCount={productosSeleccionados.length}
            saving={savingWizard}
            onFinalizar={() => void handleFinalizar()}
            onRevisarVigencia={anterior}
          />
        ) : null}

        {stepIndex < NUEVA_ESTRATEGIA_STEPS.length - 1 ? (
          <NuevaEstrategiaWizardFooter
            stepIndex={stepIndex}
            puedeContinuar={puedeContinuar}
            poolthResumen={poolthResumen}
            productosResumen={stepIndex >= 1 ? productosResumen : null}
            onAnterior={anterior}
            onSiguiente={siguiente}
            payloadReady={wizardPayload.productos.length > 0}
            saving={savingWizard}
          />
        ) : null}
      </NuevaEstrategiaWizardPanel>

      <NuevoTipoOfertaPoolModal
        open={modalNuevoTipo}
        onClose={() => setModalNuevoTipo(false)}
        onCreated={handleTipoCreated}
      />
    </div>
  );
}
