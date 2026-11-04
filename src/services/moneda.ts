const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BACKEND}/api`;

export interface CotizacionDolar {
  codigo: string;
  valor: number;
  fechaValor: string;
  fechaAlta: string;
}

export const getCotizacionDolar = async (): Promise<CotizacionDolar> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No token');
  }
  const response = await fetch(`${API_BASE_URL}/moneda/cotizacion-dolar`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch cotización (${response.status})`);
  }
  return response.json();
};

export function formatCotizacionDolarValor(valor: number): string {
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
