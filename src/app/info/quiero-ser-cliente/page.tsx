'use client';

import Bitrix24InlineForm from '@/components/bitrix/Bitrix24InlineForm';

export default function SolicitudClientePage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-xl">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Quiero ser cliente</h1>
      <p className="text-gray-600 mb-6">
        Envianos tus datos y nos pondremos en contacto a la brevedad.
      </p>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Bitrix24InlineForm formKey="solicitudCliente" />
      </div>
    </div>
  );
}
