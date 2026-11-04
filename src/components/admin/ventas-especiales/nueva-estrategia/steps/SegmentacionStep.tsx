import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  CircleCheckBig,
  FileSpreadsheet,
  Globe2,
  Loader2,
  MapPin,
  MapPinned,
  Search,
  Users,
  X,
} from 'lucide-react';
import {
  getSegmentacionClientes,
  getSegmentacionLocalidades,
  getSegmentacionProvincias,
  getSegmentacionSucursales,
  postSegmentacionImpactoEstimado,
  type SegmentacionClienteOption,
  type SegmentacionLocalidadOption,
  type SegmentacionProvinciaOption,
  type SegmentacionSucursalOption,
} from '@/services/admin';
import {
  CLIENTES_CARGADOS_PAGE_SIZE,
  CODPAI_SEGMENTACION,
  MIN_CLIENTES_SEARCH,
  SEGMENTACION_SEARCH_LIMIT,
} from '../segmentacionConstants';
import { ClientesExcelImportModal } from '../components/ClientesExcelImportModal';
import type { ClienteSegmentacionItem, SegmentacionFormData } from '../segmentacionTypes';

export type { SegmentacionFormData, ClienteSegmentacionItem };

function parseLocalidadValue(value: string): { codpai: string; codpos: string; jurisd: string | null } {
  const [codpai = '', codpos = '', jurisd = ''] = value.split('|');
  return { codpai, codpos, jurisd: jurisd || null };
}

function mergeClientes(
  existing: ClienteSegmentacionItem[],
  incoming: ClienteSegmentacionItem[]
): ClienteSegmentacionItem[] {
  const map = new Map<string, ClienteSegmentacionItem>();
  for (const c of existing) {
    map.set(c.nrocta, c);
  }
  for (const c of incoming) {
    map.set(c.nrocta, c);
  }
  return Array.from(map.values());
}

type Props = {
  value: SegmentacionFormData;
  onChange: (next: SegmentacionFormData) => void;
  productosCount?: number;
  saving?: boolean;
  onFinalizar?: () => void;
  onRevisarVigencia?: () => void;
};

const panelClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';
const sectionTitleClass = 'text-[13px] font-black uppercase tracking-[0.18em] text-[#001f3f]';
const countBadgeClass =
  'inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[#ebf8f4] px-2 py-0.5 text-[10px] font-black tabular-nums text-[#0e8c85]';
const cityFilterClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pl-9 text-[11px] font-bold uppercase tracking-wider text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-[#0e8c85] focus:bg-white focus:ring-2 focus:ring-[#0e8c85]/20';

function LoadingInline({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
      <Loader2 className="h-5 w-5 animate-spin text-[#0e8c85]" aria-hidden />
      <p className="text-[12px] font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function EmptyInline({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof MapPinned;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-4 w-4 text-slate-400" aria-hidden />
      </div>
      <p className="text-[12px] font-bold text-slate-500">{title}</p>
      {hint ? <p className="max-w-[220px] text-[11px] font-semibold text-slate-400">{hint}</p> : null}
    </div>
  );
}

function SelectionChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#0e8c85]/25 bg-[#ebf8f4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#001f3f]">
      <span className="truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex shrink-0 rounded-full p-0.5 text-[#0e8c85] hover:bg-[#0e8c85]/10"
          aria-label={`Quitar ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

export function SegmentacionStep({
  value,
  onChange,
  productosCount = 0,
  saving = false,
  onFinalizar,
  onRevisarVigencia,
}: Props) {
  const [provincias, setProvincias] = useState<SegmentacionProvinciaOption[]>([]);
  const [sucursalesCatalog, setSucursalesCatalog] = useState<SegmentacionSucursalOption[]>([]);
  const [localidades, setLocalidades] = useState<SegmentacionLocalidadOption[]>([]);
  const [clientes, setClientes] = useState<SegmentacionClienteOption[]>([]);

  const [impactoEstimado, setImpactoEstimado] = useState<number | null>(null);
  const [impactoUniversoCompleto, setImpactoUniversoCompleto] = useState(true);
  const [loadingImpacto, setLoadingImpacto] = useState(false);

  const [provinciaActiva, setProvinciaActiva] = useState<SegmentacionProvinciaOption | null>(null);
  const [provinciasMarcadas, setProvinciasMarcadas] = useState<string[]>([]);
  const [localidadQuery, setLocalidadQuery] = useState('');
  const [localidadQueryDebounced, setLocalidadQueryDebounced] = useState('');
  const [clienteCargadosQuery, setClienteCargadosQuery] = useState('');
  const [clienteAgregarQuery, setClienteAgregarQuery] = useState('');
  const [clienteAgregarQueryDebounced, setClienteAgregarQueryDebounced] = useState('');
  const [clientesCargadosPage, setClientesCargadosPage] = useState(0);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provinciaActivaCodpro = provinciaActiva?.codpro ?? null;

  useEffect(() => {
    let active = true;
    void Promise.all([
      getSegmentacionProvincias(CODPAI_SEGMENTACION),
      getSegmentacionSucursales(),
    ])
      .then(([provData, sucData]) => {
        if (!active) return;
        setProvincias(provData);
        setSucursalesCatalog(sucData);
        if (provData.length > 0) {
          setProvinciaActiva((current) => current ?? provData[0] ?? null);
        }
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'No se pudieron cargar provincias o sucursales');
      })
      .finally(() => {
        if (!active) return;
        setLoadingInit(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => setLocalidadQueryDebounced(localidadQuery.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [localidadQuery]);

  useEffect(() => {
    const handle = window.setTimeout(
      () => setClienteAgregarQueryDebounced(clienteAgregarQuery.trim()),
      300
    );
    return () => window.clearTimeout(handle);
  }, [clienteAgregarQuery]);

  useEffect(() => {
    if (!provinciaActivaCodpro) {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) setLoadingLocalidades(true);
    });

    void getSegmentacionLocalidades({
      codpai: CODPAI_SEGMENTACION,
      codpro: provinciaActivaCodpro,
      q: localidadQueryDebounced || undefined,
      limit: SEGMENTACION_SEARCH_LIMIT,
    })
      .then((data) => {
        if (!active) return;
        setLocalidades(data);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'No se pudieron cargar localidades');
        setLocalidades([]);
      })
      .finally(() => {
        if (!active) return;
        setLoadingLocalidades(false);
      });

    return () => {
      active = false;
    };
  }, [provinciaActivaCodpro, localidadQueryDebounced]);

  useEffect(() => {
    if (clienteAgregarQueryDebounced.length < MIN_CLIENTES_SEARCH) {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) setLoadingClientes(true);
    });
    void getSegmentacionClientes({ q: clienteAgregarQueryDebounced, limit: SEGMENTACION_SEARCH_LIMIT })
      .then((data) => {
        if (!active) return;
        setClientes(data);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'No se pudieron cargar clientes');
        setClientes([]);
      })
      .finally(() => {
        if (!active) return;
        setLoadingClientes(false);
      });

    return () => {
      active = false;
    };
  }, [clienteAgregarQueryDebounced]);

  const sucursalesSeleccionadas = useMemo(
    () => sucursalesCatalog.filter((s) => value.sucursales.includes(s.codigo)),
    [sucursalesCatalog, value.sucursales]
  );

  const impactoPayload = useMemo(
    () => ({
      clientes: value.clientes.map((c) => ({ nrocta: c.nrocta })),
      sucursales: value.sucursales.map((sitios) => ({ sitios })),
      localidades: value.localidades
        .map(parseLocalidadValue)
        .filter((loc) => loc.codpai && loc.codpos && loc.jurisd),
    }),
    [value.clientes, value.localidades, value.sucursales]
  );

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoadingImpacto(true);
      void postSegmentacionImpactoEstimado(impactoPayload)
        .then((data) => {
          if (!active) return;
          setImpactoEstimado(data.total);
          setImpactoUniversoCompleto(data.universoCompleto);
        })
        .catch(() => {
          if (!active) return;
          setImpactoEstimado(null);
        })
        .finally(() => {
          if (active) setLoadingImpacto(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [impactoPayload]);

  const localidadesSeleccionadasVisibles = useMemo(
    () => localidades.filter((loc) => value.localidades.includes(loc.value)).length,
    [localidades, value.localidades]
  );

  const tieneSegmentacion = useMemo(
    () =>
      value.sucursales.length > 0 || value.localidades.length > 0 || value.clientes.length > 0,
    [value.clientes.length, value.localidades.length, value.sucursales.length]
  );

  const toggleRegion = (codigo: string) => {
    const next = value.sucursales.includes(codigo)
      ? value.sucursales.filter((s) => s !== codigo)
      : [...value.sucursales, codigo];
    onChange({ ...value, sucursales: next });
  };

  const tildarTodoNacional = () => {
    onChange({
      ...value,
      sucursales: sucursalesCatalog.map((s) => s.codigo),
    });
  };

  const limpiarRegiones = () => {
    onChange({ ...value, sucursales: [] });
  };

  const toggleLocalidad = (localidadValue: string) => {
    const next = value.localidades.includes(localidadValue)
      ? value.localidades.filter((l) => l !== localidadValue)
      : [...value.localidades, localidadValue];
    onChange({ ...value, localidades: next });
  };

  const tildarTodasLocalidadesVisibles = () => {
    const visible = localidades.map((l) => l.value);
    const merged = Array.from(new Set([...value.localidades, ...visible]));
    onChange({ ...value, localidades: merged });
  };

  const limpiarLocalidadesProvinciaActiva = () => {
    if (!provinciaActiva) return;
    const visible = new Set(localidades.map((l) => l.value));
    onChange({
      ...value,
      localidades: value.localidades.filter((l) => !visible.has(l)),
    });
  };

  const toggleProvinciaMarcada = async (prov: SegmentacionProvinciaOption) => {
    const marcada = provinciasMarcadas.includes(prov.codpro);
    if (marcada) {
      setProvinciasMarcadas((prev) => prev.filter((c) => c !== prov.codpro));
      try {
        const data = await getSegmentacionLocalidades({
          codpai: CODPAI_SEGMENTACION,
          codpro: prov.codpro,
          limit: SEGMENTACION_SEARCH_LIMIT,
        });
        const values = new Set(data.map((l) => l.value));
        onChange({
          ...value,
          localidades: value.localidades.filter((l) => !values.has(l)),
        });
      } catch {
        /* noop */
      }
      return;
    }

    setProvinciasMarcadas((prev) => [...prev, prov.codpro]);
    try {
      const data = await getSegmentacionLocalidades({
        codpai: CODPAI_SEGMENTACION,
        codpro: prov.codpro,
        limit: SEGMENTACION_SEARCH_LIMIT,
      });
      const merged = Array.from(new Set([...value.localidades, ...data.map((l) => l.value)]));
      onChange({ ...value, localidades: merged });
    } catch {
      /* noop */
    }
  };

  const isClienteSelected = (nrocta: string) =>
    value.clientes.some((c) => c.nrocta === nrocta);

  const toggleClienteFromSearch = (cli: SegmentacionClienteOption) => {
    if (isClienteSelected(cli.nrocta)) {
      onChange({
        ...value,
        clientes: value.clientes.filter((c) => c.nrocta !== cli.nrocta),
      });
      return;
    }
    onChange({
      ...value,
      clientes: mergeClientes(value.clientes, [
        { nrocta: cli.nrocta, nombre: cli.nombre || cli.label },
      ]),
    });
  };

  const removeCliente = (nrocta: string) => {
    onChange({
      ...value,
      clientes: value.clientes.filter((c) => c.nrocta !== nrocta),
    });
  };

  const limpiarTodosClientes = () => {
    if (value.clientes.length === 0) return;
    const ok = window.confirm(
      `¿Quitar los ${value.clientes.length} clientes cargados de la lista?`
    );
    if (!ok) return;
    onChange({ ...value, clientes: [] });
    setClienteCargadosQuery('');
    setClientesCargadosPage(0);
  };

  const handleImportClientes = (imported: ClienteSegmentacionItem[]) => {
    onChange({
      ...value,
      clientes: mergeClientes(value.clientes, imported),
    });
    setClientesCargadosPage(0);
  };

  const clientesCargadosFiltrados = useMemo(() => {
    const q = clienteCargadosQuery.trim().toLowerCase();
    if (!q) return value.clientes;
    return value.clientes.filter(
      (c) =>
        c.nrocta.toLowerCase().includes(q) ||
        (c.nombre && c.nombre.toLowerCase().includes(q))
    );
  }, [value.clientes, clienteCargadosQuery]);

  const clientesCargadosTotalPages = useMemo(
    () => Math.max(1, Math.ceil(clientesCargadosFiltrados.length / CLIENTES_CARGADOS_PAGE_SIZE)),
    [clientesCargadosFiltrados.length]
  );

  const clientesCargadosPagina = useMemo(() => {
    const safePage = Math.min(clientesCargadosPage, clientesCargadosTotalPages - 1);
    const start = safePage * CLIENTES_CARGADOS_PAGE_SIZE;
    return clientesCargadosFiltrados.slice(start, start + CLIENTES_CARGADOS_PAGE_SIZE);
  }, [clientesCargadosFiltrados, clientesCargadosPage, clientesCargadosTotalPages]);

  useEffect(() => {
    setClientesCargadosPage(0);
  }, [clienteCargadosQuery, value.clientes.length]);

  useEffect(() => {
    if (clientesCargadosPage >= clientesCargadosTotalPages) {
      setClientesCargadosPage(Math.max(0, clientesCargadosTotalPages - 1));
    }
  }, [clientesCargadosPage, clientesCargadosTotalPages]);

  const auditRows = [
    { label: 'Productos', count: productosCount, active: productosCount > 0 },
    { label: 'Sucursales', count: sucursalesSeleccionadas.length, active: sucursalesSeleccionadas.length > 0 },
    { label: 'Ciudades', count: value.localidades.length, active: value.localidades.length > 0 },
    { label: 'Clientes B2B', count: value.clientes.length, active: value.clientes.length > 0 },
  ] as const;

  const localidadesFiltradas = useMemo(() => {
    const q = localidadQuery.trim().toLowerCase();
    if (!q || localidadQueryDebounced) return localidades;
    return localidades.filter(
      (l) => l.label.toLowerCase().includes(q) || l.codpos.toLowerCase().includes(q)
    );
  }, [localidades, localidadQuery, localidadQueryDebounced]);

  const clientesAgregarVisibles =
    clienteAgregarQueryDebounced.length >= MIN_CLIENTES_SEARCH ? clientes : [];

  const clientesCargadosDesde =
    clientesCargadosFiltrados.length === 0
      ? 0
      : Math.min(
          clientesCargadosPage * CLIENTES_CARGADOS_PAGE_SIZE + 1,
          clientesCargadosFiltrados.length
        );
  const clientesCargadosHasta = Math.min(
    (clientesCargadosPage + 1) * CLIENTES_CARGADOS_PAGE_SIZE,
    clientesCargadosFiltrados.length
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[15px] font-black uppercase tracking-wide text-[#001f3f] md:text-base">
          Segmentación de audiencia
        </h2>
        <p className="mt-1 max-w-2xl text-[12px] font-semibold text-gray-500">
          Definí regiones, localidades y clientes B2B. Si no elegís filtros, la oferta queda abierta a
          todo el universo operativo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-800">
              {error}
            </p>
          ) : null}

          {/* Sucursales / Regiones */}
          <div className={panelClass}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#0e8c85]" />
                  <h3 className={sectionTitleClass}>Sucursales (Regiones)</h3>
                  <span className={countBadgeClass}>{sucursalesSeleccionadas.length}</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500">
                  Elegí una o más regiones comerciales para filtrar el POS.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={tildarTodoNacional}
                  className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0e8c85] hover:text-[#0b6f69]"
                >
                  Tildar todo
                </button>
                {sucursalesSeleccionadas.length > 0 ? (
                  <button
                    type="button"
                    onClick={limpiarRegiones}
                    className="text-[10px] font-black uppercase tracking-[0.14em] text-red-500 hover:text-red-600"
                  >
                    Limpiar
                  </button>
                ) : null}
              </div>
            </div>

            {loadingInit && sucursalesCatalog.length === 0 ? (
              <LoadingInline label="Cargando sucursales…" />
            ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sucursalesCatalog.map((sucursal) => {
                const selected = value.sucursales.includes(sucursal.codigo);
                return (
                  <button
                    key={sucursal.codigo}
                    type="button"
                    onClick={() => toggleRegion(sucursal.codigo)}
                    title={sucursal.descripcion || sucursal.label}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      selected
                        ? 'border-[#0e8c85] bg-[#ebf8f4] shadow-sm shadow-[#0e8c85]/10'
                        : 'border-slate-200 bg-slate-50 hover:border-[#0e8c85]/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-[0.12em] ${
                          selected ? 'text-[#001f3f]' : 'text-slate-600'
                        }`}
                      >
                        {sucursal.descripcion || sucursal.label}
                      </span>
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          selected
                            ? 'border-[#0e8c85] bg-[#0e8c85] text-white'
                            : 'border-slate-200 bg-white text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    </div>
                    <span className="mt-1 block truncate text-[10px] font-semibold text-slate-500">
                      {sucursal.codigo}
                    </span>
                  </button>
                );
              })}
            </div>
            )}

            {sucursalesSeleccionadas.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {sucursalesSeleccionadas.map((sucursal) => (
                  <SelectionChip
                    key={sucursal.codigo}
                    label={sucursal.descripcion || sucursal.label}
                    onRemove={() => toggleRegion(sucursal.codigo)}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] font-semibold text-slate-400">
                Sin sucursales seleccionadas — impacto de universo completo.
              </p>
            )}
          </div>

          {/* Provincias y Localidades */}
          <div className={panelClass}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-[#0e8c85]" />
                  <h3 className={sectionTitleClass}>Provincias y localidades</h3>
                  <span className={countBadgeClass}>{value.localidades.length}</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500">
                  Marcá provincias completas o elegí ciudades puntuales.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={tildarTodasLocalidadesVisibles}
                  disabled={!provinciaActiva || localidades.length === 0}
                  className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0e8c85] hover:text-[#0b6f69] disabled:opacity-40"
                >
                  Tildar visibles
                </button>
                <button
                  type="button"
                  onClick={limpiarLocalidadesProvinciaActiva}
                  disabled={!provinciaActiva || localidadesSeleccionadasVisibles === 0}
                  className="text-[10px] font-black uppercase tracking-[0.14em] text-red-500 hover:text-red-600 disabled:opacity-40"
                >
                  Limpiar vista
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              {/* Provincias */}
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="border-b border-slate-100 bg-white px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Provincias
                  </p>
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                  {loadingInit ? (
                    <LoadingInline label="Cargando provincias…" />
                  ) : (
                    provincias.map((prov) => {
                      const activa = provinciaActiva?.codpro === prov.codpro;
                      const marcada = provinciasMarcadas.includes(prov.codpro);
                      return (
                        <div
                          key={prov.value}
                          className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
                            activa ? 'bg-[#ebf8f4]' : 'hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcada}
                            onChange={() => void toggleProvinciaMarcada(prov)}
                            className="h-4 w-4 shrink-0 accent-[#0e8c85]"
                            aria-label={`Marcar provincia ${prov.label}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProvinciaActiva(prov);
                              setLocalidadQuery('');
                            }}
                            className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                          >
                            <span
                              className={`truncate text-[12px] font-bold uppercase tracking-wide ${
                                activa ? 'text-[#001f3f]' : 'text-slate-700'
                              }`}
                            >
                              {prov.label}
                            </span>
                            {activa ? <ChevronRight className="h-4 w-4 shrink-0 text-[#0e8c85]" /> : null}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Localidades */}
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                <div className="border-b border-slate-100 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {provinciaActiva ? provinciaActiva.label : 'Localidades'}
                    </p>
                    {provinciaActiva && localidadesSeleccionadasVisibles > 0 ? (
                      <span className={countBadgeClass}>{localidadesSeleccionadasVisibles}</span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={localidadQuery}
                      onChange={(e) => setLocalidadQuery(e.target.value)}
                      placeholder="Filtrar ciudad…"
                      disabled={!provinciaActiva}
                      className={cityFilterClass}
                    />
                  </div>
                </div>
                <div className="max-h-[272px] overflow-y-auto">
                  {!provinciaActiva ? (
                    <EmptyInline
                      icon={MapPinned}
                      title="Elegí una provincia"
                      hint="Seleccioná una provincia de la lista para ver sus localidades."
                    />
                  ) : loadingLocalidades ? (
                    <LoadingInline label="Cargando localidades…" />
                  ) : localidadesFiltradas.length === 0 ? (
                    <EmptyInline
                      icon={Search}
                      title="Sin localidades"
                      hint={
                        localidadQuery.trim()
                          ? 'Probá otro término de búsqueda.'
                          : 'No hay ciudades disponibles para esta provincia.'
                      }
                    />
                  ) : (
                    <ul className="divide-y divide-slate-50">
                      {localidadesFiltradas.map((loc) => {
                        const selected = value.localidades.includes(loc.value);
                        return (
                          <li key={loc.value}>
                            <button
                              type="button"
                              onClick={() => toggleLocalidad(loc.value)}
                              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                                selected ? 'bg-[#ebf8f4]/60' : 'hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`text-[12px] font-bold uppercase tracking-wide ${
                                  selected ? 'text-[#001f3f]' : 'text-slate-700'
                                }`}
                              >
                                {loc.descripcion || loc.label}
                              </span>
                              <span
                                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                  selected
                                    ? 'border-[#0e8c85] bg-[#0e8c85] text-white'
                                    : 'border-slate-200 bg-white text-transparent'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Clientes B2B */}
          <div className={panelClass}>
            <div className="mb-3 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0e8c85]" />
                  <h3 className={sectionTitleClass}>Canales B2B / clientes</h3>
                  <span className={countBadgeClass}>{value.clientes.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0e8c85]/30 bg-[#ebf8f4] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#0e8c85] hover:bg-[#d4f3ec]"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Importar Excel
                  </button>
                  {value.clientes.length > 0 ? (
                    <button
                      type="button"
                      onClick={limpiarTodosClientes}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-100"
                    >
                      Limpiar lista
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">
                Importá un listado .xlsx o agregá cuentas puntuales para restringir la oferta.
              </p>
            </div>

            {value.clientes.length > 0 ? (
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={clienteCargadosQuery}
                    onChange={(e) => setClienteCargadosQuery(e.target.value)}
                    placeholder="Filtrar en la lista (NROCTA o razón social)…"
                    className={cityFilterClass}
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-3 py-2">NROCTA</th>
                        <th className="px-3 py-2">Razón social</th>
                        <th className="w-8 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {clientesCargadosPagina.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-[12px] font-semibold text-slate-400">
                            Sin coincidencias en la lista cargada
                          </td>
                        </tr>
                      ) : (
                        clientesCargadosPagina.map((cli) => (
                          <tr key={cli.nrocta} className="text-slate-700">
                            <td className="px-3 py-2 font-mono font-bold">{cli.nrocta}</td>
                            <td className="max-w-[200px] truncate px-3 py-2 font-medium" title={cli.nombre}>
                              {cli.nombre || '—'}
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => removeCliente(cli.nrocta)}
                                className="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                aria-label={`Quitar ${cli.nrocta}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {clientesCargadosFiltrados.length > CLIENTES_CARGADOS_PAGE_SIZE ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold text-slate-500">
                      Mostrando {clientesCargadosDesde}–{clientesCargadosHasta} de{' '}
                      {clientesCargadosFiltrados.length}
                      {clienteCargadosQuery.trim()
                        ? ` (filtrados de ${value.clientes.length})`
                        : ''}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={clientesCargadosPage <= 0}
                        onClick={() => setClientesCargadosPage((p) => Math.max(0, p - 1))}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        Anterior
                      </button>
                      <span className="px-2 text-[10px] font-bold tabular-nums text-slate-600">
                        {clientesCargadosPage + 1} / {clientesCargadosTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={clientesCargadosPage >= clientesCargadosTotalPages - 1}
                        onClick={() =>
                          setClientesCargadosPage((p) =>
                            Math.min(clientesCargadosTotalPages - 1, p + 1)
                          )
                        }
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : clientesCargadosFiltrados.length > 0 ? (
                  <p className="text-[10px] font-semibold text-slate-500">
                    {clientesCargadosFiltrados.length} cliente
                    {clientesCargadosFiltrados.length === 1 ? '' : 's'}
                    {clienteCargadosQuery.trim() ? ` (de ${value.clientes.length} cargados)` : ''}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Agregar cliente al listado
              </p>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={clienteAgregarQuery}
                  onChange={(e) => setClienteAgregarQuery(e.target.value)}
                  placeholder="Buscar en ERP (mín. 2 caracteres)…"
                  className={cityFilterClass}
                />
              </div>
              <div className="max-h-[140px] overflow-y-auto rounded-lg border border-slate-100 bg-white">
                {clienteAgregarQueryDebounced.length < MIN_CLIENTES_SEARCH ? (
                  <EmptyInline
                    icon={Users}
                    title="Buscá en el ERP"
                    hint={`Escribí al menos ${MIN_CLIENTES_SEARCH} caracteres para agregar cuentas.`}
                  />
                ) : loadingClientes ? (
                  <LoadingInline label="Buscando clientes…" />
                ) : clientesAgregarVisibles.length === 0 ? (
                  <EmptyInline
                    icon={Search}
                    title="Sin resultados"
                    hint="Probá con otro nombre o número de cuenta."
                  />
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {clientesAgregarVisibles.map((cli) => {
                      const selected = isClienteSelected(cli.nrocta);
                      return (
                        <li key={cli.value}>
                          <button
                            type="button"
                            onClick={() => toggleClienteFromSearch(cli)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[12px] font-medium ${
                              selected ? 'bg-[#ebf8f4] text-[#001f3f]' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{cli.label}</span>
                            {selected ? <Check className="h-4 w-4 text-[#0e8c85]" /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Auditoría pre-publicación */}
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-2xl bg-[#001f3f] p-5 text-white shadow-lg">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
              Auditoría pre-publicación
            </h3>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-white/50">
              {tieneSegmentacion
                ? 'Revisá el alcance antes de publicar la oferta.'
                : 'Sin filtros activos: la oferta impactará todo el universo operativo.'}
            </p>

            <dl className="mt-5 space-y-3">
              {auditRows.map(({ label, count, active }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
                    {active ? <Check className="h-3 w-3 text-[#2dd4a3]" aria-hidden /> : null}
                    {label}
                  </dt>
                  <dd className="text-[13px] font-black tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>

            {sucursalesSeleccionadas.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/10 pt-4">
                {sucursalesSeleccionadas.map((sucursal) => (
                  <span
                    key={sucursal.codigo}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/80"
                  >
                    {sucursal.descripcion || sucursal.label}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                {impactoUniversoCompleto ? 'Clientes activos (universo completo)' : 'Clientes impactados'}
              </p>
              {loadingImpacto ? (
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/70">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Calculando…
                </p>
              ) : (
                <p className="mt-1 text-4xl font-black italic leading-none text-[#2dd4a3]">
                  {impactoEstimado != null ? impactoEstimado.toLocaleString('es-AR') : '—'}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onFinalizar}
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2dd4a3] px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#001f3f] shadow-md transition hover:brightness-105 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Publicando…
                </>
              ) : (
                <>
                  <CircleCheckBig className="h-4 w-4" />
                  Publicar oferta B2B
                </>
              )}
            </button>

            {onRevisarVigencia ? (
              <button
                type="button"
                onClick={onRevisarVigencia}
                disabled={saving}
                className="mt-4 w-full text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 hover:text-white/80 disabled:opacity-40"
              >
                ‹ Revisar vigencia
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      <ClientesExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onConfirm={handleImportClientes}
      />
    </section>
  );
}
