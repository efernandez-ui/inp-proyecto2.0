'use client';
import { Provider, useSelector } from 'react-redux';
import { store } from '../store';
import { RootState } from '../store';
import AuthInitializer from './AuthInitializer';
import CartInitializer from './cart/CartInitializer';
import { CurrencyProvider } from '../hooks/useCurrencyPreference';
import { CatalogUIProvider } from '../context/CatalogUIContext';
import { PublicPopupsProvider } from '../context/PublicPopupsContext';

function AppLoader({ children }: { children: React.ReactNode }) {
  const { isLoading } = useSelector((state: RootState) => state.auth);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <CurrencyProvider>
        <CatalogUIProvider>
          <PublicPopupsProvider>
            <AuthInitializer />
            <CartInitializer />
            <AppLoader>{children}</AppLoader>
          </PublicPopupsProvider>
        </CatalogUIProvider>
      </CurrencyProvider>
    </Provider>
  );
}
