/** Por encima del navbar sticky (9999) y menú mobile (10050). */
export const MODAL_Z_INDEX_CLASS = 'z-[10100]';

/** Encima de drawers de pedidos/pendientes (100000–100001). */
export const NESTED_MODAL_Z_INDEX_CLASS = 'z-[100010]';

/** Encima de modales anidados (100010) para que react-toastify no quede detrás. */
export const TOAST_Z_INDEX = 100100;

/** Encima de cualquier modal/drawer y toast (Pedidos y seguimiento). */
export const WHATSAPP_Z_INDEX_CLASS = 'z-[100150]';

export function modalOverlayClass(zIndexClass: string = MODAL_Z_INDEX_CLASS) {
  return `fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/50 p-3 sm:p-4`;
}

export const MODAL_OVERLAY_CLASS = modalOverlayClass();
