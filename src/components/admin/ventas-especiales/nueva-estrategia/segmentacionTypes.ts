export type ClienteSegmentacionItem = {
  nrocta: string;
  nombre: string;
};

export type SegmentacionFormData = {
  clientes: ClienteSegmentacionItem[];
  sucursales: string[];
  localidades: string[];
};
