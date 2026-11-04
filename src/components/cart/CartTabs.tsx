import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { closeTab, switchCartTab, createNewCartBackend, deleteCartBackend } from '../../store/cartSlice';
import { X, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface CartTabsProps {
  onNewCart: () => void;
  nrocta?: string;
}

const CartTabs: React.FC<CartTabsProps> = ({ onNewCart, nrocta }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { openCarts, activeCartId, loading, switchingCartId } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);

  const handleTabClick = (id: number) => {
    if (!id || id === activeCartId) return;
    const token = localStorage.getItem('authToken');
    if (token) {
      dispatch(switchCartTab({ id, token }));
    }
  };

  const handleCloseTab = async (e: React.MouseEvent, id: number, editable?: boolean) => {
    e.stopPropagation();
    if (editable === false) {
      toast.info('Este carrito es de solo lectura');
      return;
    }

    if (window.confirm('¿Está seguro que desea eliminar este pedido por completo?')) {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await dispatch(deleteCartBackend({ cartId: id, token })).unwrap();
          toast.success('Pedido eliminado');
        } catch (error) {
          toast.error('Error al eliminar el pedido');
        }
      } else {
        // Si no hay token, al menos lo quitamos localmente (aunque no debería pasar)
        dispatch(closeTab(id));
      }
    }
  };

  if (!openCarts || openCarts.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
      {openCarts.map((cart) => (
        <div
          key={cart.id}
          onClick={() => handleTabClick(cart.id)}
          className={`group relative flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all border-x border-t min-w-[140px] max-w-[200px] ${activeCartId === cart.id
            ? "bg-white border-gray-200 text-[#001f3f] font-black shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
            : "bg-gray-50/50 border-transparent text-gray-400 font-bold hover:bg-gray-100/50"
            }`}
        >
          <div className={`w-2 h-2 rounded-full ${activeCartId === cart.id ? "bg-green-500" : "bg-gray-300"
            }`} />

          <span className="text-[11px] uppercase truncate tracking-wider">
            {((activeCartId === cart.id && loading) || (switchingCartId === cart.id && loading))
              ? 'Cargando...'
              : (cart.id && cart.titulo ? `${cart.titulo}` : `Pedido #${cart.id}`)}
          </span>
          {activeCartId === cart.id && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#001f3f]" />
          )}
        </div>
      ))}

      {/* Botón Añadir Nuevo Pedido */}
      <button
        onClick={() => {
          const token = localStorage.getItem('authToken');
          if (token && nrocta) {
            if (window.confirm('¿Está seguro que desea crear un nuevo pedido vacío?')) {
              dispatch(createNewCartBackend({ nrocta, token })).unwrap().then(() => {
                toast.success('Nuevo pedido generado con éxito');
              }).catch(() => {
                toast.error('Error al crear el nuevo pedido');
              });
            }
          } else {
            toast.warning('Seleccione un cliente para crear un nuevo pedido');
          }
        }}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#001f3f] text-white hover:bg-[#001f3f]/90 transition-all shadow-sm shrink-0"
        title="Nuevo Pedido"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default CartTabs;
