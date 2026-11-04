import type { AppDispatch } from '../store';
import { getCotizacionDolar } from '../services/moneda';
import { setCotizacionDolar } from '../store/authSlice';

export async function loadCotizacionDolar(dispatch: AppDispatch): Promise<void> {
  try {
    const cotizacion = await getCotizacionDolar();
    dispatch(setCotizacionDolar(cotizacion));
  } catch {
    dispatch(setCotizacionDolar(null));
  }
}
