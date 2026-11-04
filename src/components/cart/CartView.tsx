'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import {
  Trash2,
  Check,
  Loader2,
  ShoppingCart,
  ArrowLeft,
  ChevronRight,
  FileText,
  Package,
  Calculator,
  AlertCircle,
  Clock,
  User,
  Tags,
  Plus,
  MapPin,
  FileSpreadsheet
} from 'lucide-react'
import { RootState, AppDispatch } from '../../store'
import { isStaff } from '../../utils/auth'
import { formatCmPercent } from '@/utils/cartContribucionMarginal'
import {
  clearCart,
  checkoutCart,
  clearCheckoutError,
  fetchActiveCart,
  ensureCartFresh,
  setTitulo,
  addTab,
  switchTab,
  updateCartBackend,
  deleteCartBackend,
  importCartItemsBackend,
  loadFullCart,
} from '../../store/cartSlice'
import CartItem from './CartItem'
import CartTabs from './CartTabs'
import { CartExcelImportModal } from './CartExcelImportModal'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { extractErrorMessage, parseCheckoutErrors } from '@/utils/apiError'
import { getDireccionesEntrega, type DireccionEntrega } from '@/services/cart'

const CDENTR_DEPOSITO = '99'

export default function CartView() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const {
    items,
    notes,
    totalAmount,
    totalWeight,
    loading,
    checkoutError,
    activeCartId,
    nrocta,
    nombreCliente,
    titulo,
    fecha,
    nrofor,
    openCarts,
    importeContribucionMarginalTotal,
    porcentajeContribucionMarginalTotal,
    cdent1,
    editable,
    cartUsername,
  } = useSelector((state: RootState) => state.cart)
  const { user, selectedClient } = useSelector((state: RootState) => state.auth)
  const readOnly = editable === false

  const [localNotes, setLocalNotes] = useState(notes || '')
  const [localTitulo, setLocalTitulo] = useState(titulo || '')
  const [direcciones, setDirecciones] = useState<DireccionEntrega[]>([])
  const [direccionLoading, setDireccionLoading] = useState(false)
  const [direccionSaving, setDireccionSaving] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const prevActiveCartIdRef = useRef(activeCartId)
  /** Misma regla que legacy: columnas de bonif/CM visibles para internos (V, A, S, B), no para cliente (C) ni portal (P). */
  const showStaffCartColumns = isStaff(user)

  // Solo cdent1: no inferir depósito por transporte 000118 (eso trababa el select al volver).
  const selectedCdentr = (cdent1 || '').trim()
  const activeCartInOpenTabs =
    activeCartId != null && (openCarts?.some((c) => c.id === activeCartId) ?? false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token || !user) return
    if (isStaff(user) && !selectedClient) return

    if (!activeCartId) {
      dispatch(fetchActiveCart({ token, nrocta: selectedClient?.nrocta }))
      return
    }

    dispatch(ensureCartFresh({ id: activeCartId, token }))
  }, [dispatch, activeCartId, selectedClient, user])

  useEffect(() => {
    let mounted = true
    const token = localStorage.getItem('authToken')
    if (!token || !activeCartId || !activeCartInOpenTabs) {
      setDirecciones([])
      setDireccionLoading(false)
      return
    }
    setDireccionLoading(true)
    getDireccionesEntrega(activeCartId, token)
      .then((list) => {
        if (mounted) setDirecciones(list ?? [])
      })
      .catch(() => {
        if (mounted) {
          setDirecciones([])
          toast.error('No se pudieron cargar las direcciones de entrega')
        }
      })
      .finally(() => {
        if (mounted) setDireccionLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [activeCartId, activeCartInOpenTabs])

  const handleDireccionChange = async (cdentr: string) => {
    const token = localStorage.getItem('authToken')
    if (!token || !activeCartId || !cdentr) return
    if (cdentr === selectedCdentr) return
    setDireccionSaving(true)
    try {
      await dispatch(updateCartBackend({ cartId: activeCartId, updates: { cdentr }, token })).unwrap()
    } catch (e) {
      toast.error(extractErrorMessage(e, 'No se pudo actualizar la dirección de entrega'))
    } finally {
      setDireccionSaving(false)
    }
  }

  // Al cambiar de pestaña, sincronizar campos locales antes del auto-save (evita PUT espurio).
  useEffect(() => {
    if (prevActiveCartIdRef.current !== activeCartId) {
      setLocalNotes(notes || '')
      setLocalTitulo(titulo || '')
      prevActiveCartIdRef.current = activeCartId
    }
  }, [activeCartId, notes, titulo])

  useEffect(() => {
    setLocalNotes(notes)
  }, [notes])

  useEffect(() => {
    setLocalTitulo(titulo || '')
  }, [titulo])

  // Auto-guardado de titulo y notas
  useEffect(() => {
    if (!activeCartId) return
    
    const currentTitulo = titulo || ''
    const currentNotes = notes || ''
    
    const needsTituloSave = localTitulo !== currentTitulo
    const needsNotesSave = localNotes !== currentNotes
    
    if (!needsTituloSave && !needsNotesSave) return

    const timer = setTimeout(() => {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const updates: any = {}
      if (needsTituloSave) updates.titulo = localTitulo
      if (needsNotesSave) updates.notes = localNotes

      console.log('Auto-guardado cart:', updates)
      dispatch(updateCartBackend({ cartId: activeCartId, updates, token }))
    }, 1500) // Increased to 1.5s to be less aggressive
    
    return () => clearTimeout(timer)
  }, [localTitulo, localNotes, activeCartId, dispatch, titulo, notes])

  const handleConfirm = async () => {
    if (!activeCartId) return
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Debe iniciar sesión para confirmar el pedido')
      return
    }
    dispatch(clearCheckoutError())
    try {
      await dispatch(checkoutCart({ cartId: activeCartId, token })).unwrap()
      toast.success('Pedido confirmado exitosamente')
      router.push('/')
    } catch (error) {
      const message = extractErrorMessage(error, 'Error al confirmar el pedido')
      const { title, items } = parseCheckoutErrors(message)
      toast.error(items.length === 1 ? items[0] : title, { autoClose: 8000 })
    }
  }

  const checkoutErrorDetail = checkoutError ? parseCheckoutErrors(checkoutError) : null

  const handleClear = async () => {
    if (window.confirm('¿Está seguro que desea vaciar el carrito?')) {
      dispatch(clearCart())
    }
  }

  const handleDeleteCart = async () => {
    if (activeCartId && window.confirm('¿Está seguro que desea eliminar este pedido por completo?')) {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await dispatch(deleteCartBackend({ cartId: activeCartId, token })).unwrap();
          toast.success('Pedido eliminado');
        } catch (error) {
          toast.error('Error al eliminar el pedido');
        }
      }
    }
  }

  const handleImportExcel = async (rows: { codigo: string; cantidad: number; row: number }[]) => {
    if (!activeCartId) {
      throw new Error('No hay un carrito activo')
    }
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Debe iniciar sesión para importar')
    }
    const response = await dispatch(
      importCartItemsBackend({
        cartId: activeCartId,
        token,
        nrocta: selectedClient?.nrocta || nrocta,
        items: rows.map((r) => ({
          codigo: r.codigo,
          cantidad: r.cantidad,
          row: r.row,
        })),
      })
    ).unwrap()

    if ((response.imported ?? 0) > 0) {
      // Refresco de precios: no debe tumbar un import ya exitoso
      try {
        await dispatch(
          loadFullCart({
            id: activeCartId,
            token,
            refresh: true,
          })
        ).unwrap()
      } catch {
        // El carrito ya quedó importado; el usuario verá ítems (precios pueden requerir F5)
      }
    }

    return {
      imported: response.imported ?? 0,
      errors: (response.errors ?? []).map((e) => ({
        row: e.row,
        codigo: e.codigo,
        message: e.message,
      })),
    }
  }

  const handleNewOrder = () => {
    const token = localStorage.getItem('authToken')
    if (token && activeCartId) {
      dispatch(updateCartBackend({ cartId: activeCartId, updates: { status: 'PENDING' }, token }))
    }
  }

  const activeCart = openCarts?.find(c => c.id === activeCartId)

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 font-sans">
      {/* Header del Carrito */}
      <div className="bg-white border-b border-gray-200 mb-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0 flex-1">
            <div className="p-2.5 bg-[#001f3f] rounded-lg shadow-sm shrink-0">
              <ShoppingCart className="text-white" size={24} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h3 className="text-xl md:text-2xl font-black text-[#001f3f] italic tracking-tighter uppercase leading-none">
                {activeCart && activeCart.id ? `PEDIDO #${activeCart.id}` : 'GESTIÓN DE CARRITOS'}
              </h3>
              <div className="w-12 md:w-16 h-1 bg-[#001f3f] mt-2 mb-1.5 rounded-full" />
              <div className="flex flex-wrap items-center gap-4 text-gray-400">
                <p className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest leading-tight">
                  {activeCart?.titulo || 'Detalle y edición de pedidos múltiples'}
                </p>
                {fecha && (
                  <span className="flex items-center gap-1.5 text-[10px] md:text-[12px] font-bold border-l border-gray-200 pl-4">
                    <Clock size={12} />
                    {new Date(fecha).toLocaleDateString('es-AR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Selector de Modo removido para evitar confusión */}

        {/* Pestañas */}
        <div className="mb-6">
          <CartTabs onNewCart={handleNewOrder} nrocta={nrocta || undefined} />
        </div>

        {readOnly && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-[12px] font-black uppercase text-amber-900 tracking-wide">
                Solo lectura — carrito de {cartUsername || 'otro usuario'}
              </p>
              <p className="text-[12px] text-amber-800 mt-1">
                Podés consultar el pedido, pero no modificar cantidades, notas ni confirmarlo.
              </p>
            </div>
          </div>
        )}

        {checkoutErrorDetail && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4" role="alert">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={22} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-black text-red-900 uppercase mb-2">
                {checkoutErrorDetail.title}
              </p>
              <ul className="space-y-1.5">
                {checkoutErrorDetail.items.map((item, idx) => (
                  <li key={idx} className="text-[12px] text-red-800 font-medium leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => dispatch(clearCheckoutError())}
              className="text-red-400 hover:text-red-700 text-xs font-bold uppercase shrink-0"
              aria-label="Cerrar error"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Detalle */}
          <div className="col-span-12 lg:col-span-9 space-y-4">
            {/* Info Pedido */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <Tags size={14} className="text-[#001f3f]" />
                    Referencia / Identificador
                  </label>
                  <input
                    type="text"
                    value={localTitulo}
                    disabled={readOnly}
                    onChange={(e) => setLocalTitulo(e.target.value)}
                    onBlur={() => {
                      if (readOnly) return
                      if (localTitulo !== (titulo || '')) {
                        const token = localStorage.getItem('authToken')
                        if (token && activeCartId) {
                          dispatch(updateCartBackend({ cartId: activeCartId, updates: { titulo: localTitulo }, token }))
                        }
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-black focus:ring-1 focus:ring-[#001f3f] outline-none transition-all disabled:opacity-60"
                    placeholder="Ej: Stock Local - Marzo"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-[#001f3f]" />
                      Notas de Logística
                    </label>
                  </div>
                  <textarea
                    value={localNotes || ''}
                    disabled={readOnly}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={() => {
                      if (readOnly) return
                      if (localNotes !== (notes || '')) {
                        const token = localStorage.getItem('authToken')
                        if (token && activeCartId) {
                          dispatch(updateCartBackend({ cartId: activeCartId, updates: { notes: localNotes }, token }))
                        }
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-1.5 text-sm font-bold text-black focus:ring-1 focus:ring-[#001f3f] h-[46px] resize-none outline-none transition-all disabled:opacity-60"
                    placeholder="Aclaraciones importantes..."
                  />
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <label className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-[#001f3f]" />
                  Dirección de entrega
                </label>
                <select
                  value={selectedCdentr}
                  disabled={readOnly || direccionLoading || direccionSaving || direcciones.length === 0}
                  onChange={(e) => handleDireccionChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-black focus:ring-1 focus:ring-[#001f3f] outline-none transition-all disabled:opacity-60"
                >
                  {direccionLoading && (
                    <option value="">Cargando direcciones…</option>
                  )}
                  {!direccionLoading && direcciones.length === 0 && (
                    <option value="">Sin direcciones disponibles</option>
                  )}
                  {!direccionLoading &&
                    selectedCdentr &&
                    !direcciones.some((d) => d.cdentr === selectedCdentr) && (
                      <option value={selectedCdentr}>
                        {selectedCdentr === CDENTR_DEPOSITO
                          ? 'RETIRAR EN DEPOSITO INTERCAP'
                          : `Dirección actual (${selectedCdentr})`}
                      </option>
                    )}
                  {direcciones.map((dir) => (
                    <option key={dir.cdentr} value={dir.cdentr}>
                      {dir.label || dir.direcc || dir.cdentr}
                    </option>
                  ))}
                </select>
                {direccionSaving && (
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Guardando dirección…
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center gap-3">
                <h3 className="text-[11px] font-black text-[#001f3f] uppercase tracking-widest flex items-center gap-2">
                  <Package size={14} /> Artículos ({items.length})
                </h3>
                {!readOnly && (
                  <button
                    type="button"
                    disabled={!activeCartId}
                    onClick={() => setImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#001f3f] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#003366] disabled:opacity-40"
                  >
                    <FileSpreadsheet size={13} />
                    Importar Excel
                  </button>
                )}
              </div>
              {items.length > 0 && (
                <div
                  className="hidden md:grid grid-cols-12 gap-1 lg:gap-2 xl:gap-4 items-end border-b border-gray-200 bg-white px-2 py-2.5 text-[9px] font-bold text-gray-500 uppercase tracking-tight"
                  aria-hidden
                >
                  <div className={showStaffCartColumns ? 'col-span-3 pl-2' : 'col-span-5 pl-2'}>Producto</div>
                  <div className="col-span-1 text-center border-l border-gray-100">Peso T.</div>
                  {showStaffCartColumns && <div className="col-span-1 text-center border-l border-gray-100">% Bonif 1</div>}
                  <div className="col-span-1 text-center border-l border-gray-100">Cant</div>
                  {showStaffCartColumns && <div className="col-span-1 text-center border-l border-gray-100">% Bonif 2</div>}
                  <div className="col-span-2 text-center border-l border-gray-100">Unit. c/IVA</div>
                  <div className="col-span-2 text-right border-l border-gray-100 pr-2 xl:pr-6">Total c/IVA</div>
                  <div className="col-span-1 text-right pr-3 text-[8px]">{showStaffCartColumns ? 'CM' : ' '}</div>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {items.length > 0 ? (
                  items.map((item) => (
                    <CartItem
                      key={item.itemId}
                      item={item}
                      isVendedor={showStaffCartColumns}
                      cartId={activeCartId!}
                      readOnly={readOnly}
                    />
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                      <ShoppingCart size={30} className="text-gray-200" />
                    </div>
                    <p className="text-[11px] font-black text-[#001f3f] uppercase tracking-widest mb-1">Este pedido está vacío</p>
                    <p className="text-[10px] text-gray-400 font-bold max-w-[200px]">Agregue productos desde el catálogo para continuar cargando este pedido.</p>
                    <button
                      onClick={() => router.push('/')}
                      className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-[#001f3f] hover:underline"
                    >
                      <Plus size={12} /> Ir al Catálogo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Sidebar */}
          <div className="col-span-12 lg:col-span-3 sticky top-24 min-w-0">
            <div className="bg-[#001f3f] text-white rounded-3xl p-6 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-6 right-6 p-2 text-white/30 hover:text-red-400 transition-colors z-20"
                >
                  <Trash2 size={18} />
                </button>
              )}

              <div className="relative z-10">
                <p className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.2em] mb-5">Resumen del Pedido</p>

                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-baseline gap-3 bg-white/10 rounded-2xl px-3.5 py-3 border border-white/10 min-w-0">
                    <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider shrink-0">Subtotal</span>
                    <span className="block text-xs sm:text-sm font-medium text-white tabular-nums tracking-tight text-right min-w-0 overflow-x-auto [scrollbar-width:thin]">
                      ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline gap-3 bg-white/10 rounded-2xl px-3.5 py-3 border border-white/10 min-w-0">
                    <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider shrink-0">Peso Total</span>
                    <span className="block text-sm font-medium text-white tabular-nums tracking-tight text-right min-w-0">
                      {totalWeight.toFixed(2)} KG
                    </span>
                  </div>

                  {showStaffCartColumns && (
                    <>
                      <div className="flex justify-between items-baseline gap-3 bg-white/10 rounded-2xl px-3.5 py-3 border border-white/10 min-w-0">
                        <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider shrink-0">Importe CM Total</span>
                        <span className="block text-xs sm:text-sm font-medium text-white tabular-nums tracking-tight text-right min-w-0">
                          {importeContribucionMarginalTotal != null
                            ? `$${Number(importeContribucionMarginalTotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline gap-3 bg-white/10 rounded-2xl px-3.5 py-3 border border-white/10 min-w-0">
                        <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider shrink-0">Porc. CM Total</span>
                        <span className="block text-xs sm:text-sm font-medium text-white tabular-nums tracking-tight text-right min-w-0">
                          {formatCmPercent(porcentajeContribucionMarginalTotal)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10 mb-8 min-w-0">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-baseline sm:gap-3 mb-1 min-w-0">
                    <span className="text-[10px] font-semibold text-white/90 uppercase tracking-widest shrink-0">Total Final</span>
                    <span className="block text-base sm:text-lg font-medium text-white tabular-nums tracking-tight text-left sm:text-right min-w-0 overflow-x-auto [scrollbar-width:thin] leading-snug">
                      ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[9px] font-medium text-white/50 text-left sm:text-right italic">IVA Incluido (Estimación)</p>
                </div>

                {checkoutErrorDetail && (
                  <div className="mb-4 rounded-xl border border-red-300/40 bg-red-500/15 px-3 py-3 text-left">
                    <p className="text-[10px] font-black uppercase text-red-100 mb-1">
                      {checkoutErrorDetail.title}
                    </p>
                    <p className="text-[11px] text-red-50 leading-snug line-clamp-4">
                      {checkoutErrorDetail.items.join(' ')}
                    </p>
                  </div>
                )}

                {!readOnly && (
                  <>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={loading}
                      className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-black py-4.5 rounded-2xl uppercase tracking-widest text-[13px] flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                      Confirmar Pedido
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteCart}
                      disabled={loading}
                      className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[13px] flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                      Eliminar Pedido
                    </button>
                  </>
                )}
              </div>

              <div className="mt-12 flex flex-col items-center relative z-10">
                <p className="text-[10px] font-black text-white/10 italic uppercase tracking-[0.4em]">Intercap System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CartExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportExcel}
      />
    </div>
  )
}
