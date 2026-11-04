'use client';

import { useState } from 'react';
import Bitrix24FormModal from '@/components/bitrix/Bitrix24FormModal';

export default function SolicitarTerminalSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mt-5 rounded-2xl border-2 border-[#0e8c85]/25 bg-[#0e8c85]/5 p-4">
        <p className="text-sm font-bold text-[#001f3f]">¿Necesitás equipamiento?</p>
        <p className="mt-1 text-xs text-gray-500">
          Gestioná tu nueva terminal con asesoramiento personalizado.
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-4 w-full rounded-xl bg-[#0e8c85] py-3 text-sm font-black uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.99]"
        >
          Solicitar Terminal
        </button>
      </div>

      <Bitrix24FormModal
        formKey="solicitarTerminal"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
