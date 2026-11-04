import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../services/auth';
import { CotizacionDolar } from '../services/moneda';

interface AuthState {
  user: User | null;
  selectedClient: any | null;
  cotizacionDolar: CotizacionDolar | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  selectedClient: null,
  cotizacionDolar: null,
  isLoggedIn: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoggedIn = true;
      state.isLoading = false;
      if (action.payload.tipo === 'C') {
        state.selectedClient = action.payload;
      }
    },
    logout: (state) => {
      state.user = null;
      state.selectedClient = null;
      state.cotizacionDolar = null;
      state.isLoggedIn = false;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedClient');
        localStorage.removeItem('intercap_cart');
      }
    },
    setSelectedClient: (state, action: PayloadAction<any>) => {
      state.selectedClient = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('selectedClient', JSON.stringify(action.payload));
        } else {
          localStorage.removeItem('selectedClient');
        }
      }
    },
    setCotizacionDolar: (state, action: PayloadAction<CotizacionDolar | null>) => {
      state.cotizacionDolar = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { login, logout, setLoading, setSelectedClient, setCotizacionDolar } = authSlice.actions;
export default authSlice.reducer;
