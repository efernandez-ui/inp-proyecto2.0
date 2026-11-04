'use client';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { cerrarSoloLecturaModal } from '@/store/cartSlice';

/** Aviso al intentar agregar ítems a un carrito de solo lectura (mismo estilo que duplicados de informe de pago). */
export default function CarritoSoloLecturaModal() {
  const dispatch = useDispatch();
  const open = useSelector((s: RootState) => s.cart.soloLecturaBloqueado === true);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-black uppercase tracking-tight text-[#001f3f]">
          Carrito de solo lectura
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          No se puede agregar el producto al carrito actual, ya que fue generado por el cliente y no
          está permitida su modificación.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => dispatch(cerrarSoloLecturaModal())}
            className="rounded-xl bg-[#001f3f] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#002a55]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
