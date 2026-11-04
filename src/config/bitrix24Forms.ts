export const BITRIX24_FORMS = {
  solicitudCliente: {
    formInlineId: 'inline/13/zplxik',
    loaderUrl: 'https://cdn.bitrix24.es/b19949787/crm/form/loader_13.js',
    title: 'Solicitud de cliente',
  },
  sugerenciasReclamos: {
    formInlineId: 'inline/17/ubgd5h',
    loaderUrl: 'https://cdn.bitrix24.es/b19949787/crm/form/loader_17.js',
    title: 'Sugerencias y reclamos',
  },
  solicitarTerminal: {
    formInlineId: 'inline/35/wb0220',
    loaderUrl: 'https://cdn.bitrix24.es/b19949787/crm/form/loader_35.js',
    title: 'Solicitar Terminal',
  },
} as const;

export type Bitrix24FormKey = keyof typeof BITRIX24_FORMS;
