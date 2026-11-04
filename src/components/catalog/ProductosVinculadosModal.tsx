'use client';

import { X } from 'lucide-react';
import Modal from '../modals/Modal';
import ProductVinculadosGrid from './ProductVinculadosGrid';
import type { ProductoDTO } from '@/interfaces/producto';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: ProductoDTO[];
  loading?: boolean;
  emptyMessage?: string;
  overlayZIndexClass?: string;
};

export default function ProductosVinculadosModal({
  isOpen,
  onClose,
  title,
  items,
  loading = false,
  emptyMessage = 'No hay productos disponibles en estos momentos.',
  overlayZIndexClass,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayZIndexClass={overlayZIndexClass}
      contentClassName="w-full max-w-7xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <ProductVinculadosGrid
            products={items}
            loading={loading}
            emptyMessage={emptyMessage}
            embeddedInVinculados
          />
        </div>
      </div>
    </Modal>
  );
}
