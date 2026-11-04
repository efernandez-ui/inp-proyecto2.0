'use client'
import React, { useEffect, useState } from 'react'
import { getCarts, deleteCart } from '@/services/cart'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { loadFullCart, clearCart } from '@/store/cartSlice'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { 
  FileText, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Package, 
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react'

export default function CarritosPage() {
  const [carts, setCarts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedClient } = useSelector((state: RootState) => state.auth)
  const { nroPool: activeNroPool } = useSelector((state: RootState) => state.cart)
  const dispatch = useDispatch()
  const router = useRouter()

  useEffect(() => {
    fetchCarts()
  }, [selectedClient])

  const fetchCarts = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/?login=1')
      return
    }

    try {
      const data = await getCarts(token, selectedClient?.nrocta)
      // Filter out confirmed carts if we only want "Pendientes"
      setCarts(data.filter((c: any) => c.estado !== 'CONFIRMADO'))
    } catch (error) {
      toast.error('Error al cargar la lista de carritos')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (id: number) => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      // @ts-ignore
      await dispatch(loadFullCart({ id, token, refresh: false })).unwrap()
      toast.success('Carrito cargado correctamente')
      router.push('/carrito')
    } catch (error) {
      toast.error('Error al cargar el carrito')
    }
  }

  const handleDelete = async (id: number, editable?: boolean) => {
    if (editable === false) {
      toast.info('Solo lectura: no podés eliminar carritos de otro usuario')
      return
    }
    if (!window.confirm('¿Está seguro que desea eliminar este borrador?')) return

    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      await deleteCart(id, token)
      toast.success('Borrador eliminado')
      
      // If the deleted cart is currently active in Redux, clear it
      if (activeNroPool === id) {
        dispatch(clearCart())
      }
      
      fetchCarts()
    } catch (error) {
      toast.error('Error al eliminar el borrador')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001f3f]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 font-sans">
      <div className="border-b-4 border-[#001f3f] pb-4 mb-8">
        <h1 className="text-4xl font-black text-[#001f3f] italic tracking-tighter uppercase leading-none">
          MIS CARRITOS
        </h1>
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-2">
          Gestione sus borradores y pedidos pendientes
        </p>
      </div>

      {carts.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
          <FileText size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-[#001f3f] uppercase tracking-tight mb-2">
            NO HAY CARRITOS PENDIENTES
          </h3>
          <p className="text-gray-500 mb-6">Parece que no tienes ningún borrador guardado en este momento.</p>
          <button 
            onClick={() => router.push('/catalogo')}
            className="bg-[#001f3f] text-white font-black px-8 py-3 rounded uppercase tracking-widest text-[11px] hover:bg-[#0e8c85] transition-all"
          >
            Ir al Catálogo
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {carts.map((cart) => (
            <div 
              key={cart.id}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row"
            >
              {/* Status Indicator */}
              <div className="w-2 bg-[#0e8c85]" />
              
              <div className="p-6 flex-grow flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Info Main */}
                <div className="flex-grow space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#001f3f] text-white text-[10px] font-black px-2 py-1 rounded">
                      #{String(cart.id).padStart(8, '0')}
                    </span>
                    <span className="text-[10px] font-black text-[#0e8c85] uppercase tracking-widest flex items-center gap-1">
                      <Clock size={12} /> {cart.estado || 'BORRADOR'}
                    </span>
                    {cart.titulo && (
                      <span className="text-[12px] font-black text-[#001f3f] uppercase italic tracking-tight border-l-2 border-gray-200 pl-3">
                        {cart.titulo}
                      </span>
                    )}
                    {cart.username && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide border-l-2 border-gray-200 pl-3">
                        {cart.editable === false ? `Solo lectura · ${cart.username}` : cart.username}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-[12px] font-bold uppercase whitespace-nowrap">
                        {new Date(cart.fechaCreacion).toLocaleDateString()}
                      </span>
                    </div>
                    {cart.nombreCliente && (
                      <div className="flex items-center gap-2 text-[#0e8c85]">
                        <span className="text-[12px] font-black uppercase tracking-tight">
                          CLIENTE: {cart.nombreCliente} ({cart.nrocta})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                      <Package size={14} className="text-gray-400" />
                      <span className="text-[12px] font-bold uppercase whitespace-nowrap">
                        {cart.items?.length || 0} ITEMS
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#001f3f] font-black">
                      <span className="text-[12px] uppercase whitespace-nowrap">
                        TOTAL: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cart.totalAmount || 0)}
                      </span>
                    </div>
                  </div>

                  {cart.observaciones && (
                    <div className="flex items-start gap-2 text-gray-400 bg-gray-50 p-3 rounded-lg border border-gray-100 max-w-2xl">
                      <MessageSquare size={14} className="mt-1 flex-shrink-0" />
                      <p className="text-[11px] italic line-clamp-2 leading-relaxed">
                        {cart.observaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
                  <button 
                    onClick={() => handleSelect(cart.id)}
                    className="flex-grow md:flex-none bg-[#001f3f] hover:bg-[#0e8c85] text-white font-black px-6 py-3 rounded uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                  >
                    {cart.editable === false ? 'VER' : 'CONTINUAR'} <ArrowRight size={14} />
                  </button>
                  {cart.editable !== false && (
                    <button 
                      onClick={() => handleDelete(cart.id, cart.editable)}
                      className="flex-shrink-0 p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar borrador"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] italic">
        intercap :: gestión de carritos :: v2.0
      </div>
    </div>
  )
}
