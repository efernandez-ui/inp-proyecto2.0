'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  HelpCircle,
  Home,
  Layers,
  ShoppingBag,
  Menu,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logout as logoutAction, setSelectedClient } from '../store/authSlice';
import { logout as logoutService, getClients } from '../services/auth';
import { fetchActiveCart as fetchLatestDraft, resetStaffCartWithoutClient } from '../store/cartSlice';
import { clearFavorites } from '../store/favoritesSlice';
import CatalogMegaMenu from './CatalogMegaMenu';
import CatalogMobileMenu from './CatalogMobileMenu';
import ClientSelector from './cart/ClientSelector';
import CotizacionDolarLabel from './CotizacionDolarLabel';
import SaldoVencidoBell from './SaldoVencidoBell';
import UserProfileMenu from './UserProfileMenu';
import MobileNavDrawer from './MobileNavDrawer';
import { useHoverIntent } from '../hooks/useHoverIntent';
import Modal from './modals/Modal';
import ModalLogin from './modals/ModalLogin';
import Bitrix24FormModal from './bitrix/Bitrix24FormModal';
import type { Bitrix24FormKey } from '@/config/bitrix24Forms';
import { usePublicPopups } from '@/context/PublicPopupsContext';
import { searchProduct, searchProductByInternalCode, Sugerencia, getHeaders, API_BASE_URL } from '@/services/products';
import { isStaff, canAccessCuentaCorriente } from '@/utils/auth';
import { isCatalogNavActive, isNavLinkActive } from '@/utils/navLinkActive';
const CORPORATE_PURPLE = '#001f3f';
const CORPORATE_PURPLE_DARK = '#001528';
const ACTION_BLUE = '#0e8c85';

type NavLinkItem = {
  name: string;
  href: string;
  highlight?: boolean;
  bitrixForm?: Bitrix24FormKey;
  popup?: 'sucursales';
};

// Componente Switch de Navegación
function NavSwitch({ activePath }: { activePath: string }) {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  const isInternalCode = (code: string) => {
    return code.length >= 9 && code.length <= 15 && /^\d+$/.test(code);
  };

  const handleSwitch = (path: string) => {
    if (activePath === path) return;
    setIsAnimating(true);
    router.push(path);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const isCatalogActive = activePath === '/catalogo' || activePath.startsWith('/catalogo?');

  return (
    <div className="relative flex items-center gap-1.5 shrink-0">
      <AnimatePresence mode="wait">
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-6 bg-white/20 rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => handleSwitch('/')}
        className={`
          relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full
          text-[11px] font-bold transition-all duration-200
          ${!isCatalogActive
            ? 'text-[#001f3f] bg-white shadow-sm'
            : 'text-white border border-white/35 hover:bg-white/10'}
        `}
      >
        <Home className="h-3.5 w-3.5" />
        Home
      </button>
      <button
        onClick={() => handleSwitch('/catalogo')}
        className={`
          relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full
          text-[11px] font-bold transition-all duration-200
          ${isCatalogActive
            ? 'text-[#001f3f] bg-white shadow-sm'
            : 'text-white border border-white/35 hover:bg-white/10'}
        `}
      >
        <Layers className="h-3.5 w-3.5" />
        Catálogo
      </button>
    </div>
  );
}

function ActiveCartWidget({
  activeCart,
  cartItemCount,
}: {
  activeCart?: { id: number | string; titulo?: string };
  cartItemCount: number;
}) {
  const badge =
    cartItemCount > 0 ? (
      <span
        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-[#001f3f]"
      >
        {cartItemCount}
      </span>
    ) : null;

  if (!activeCart) {
    return (
      <Link
        href="/carrito"
        className="relative inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 p-2.5 hover:bg-white/10 transition-colors shrink-0"
        title="Ver carrito"
      >
        <ShoppingBag className="h-5 w-5 text-white" strokeWidth={1.75} />
        {badge}
      </Link>
    );
  }

  return (
    <Link
      href="/carrito"
      className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/5 pl-3 pr-1 py-1 hover:bg-white/10 transition-colors shrink-0 max-w-[240px]"
      title="Ver pedido activo"
    >
      <span className="relative inline-flex items-center justify-center shrink-0 pr-1">
        <ShoppingBag className="h-5 w-5 text-white" strokeWidth={1.75} />
        {badge}
      </span>
      <span
        style={{ backgroundColor: ACTION_BLUE }}
        className="rounded-full px-4 py-1.5 text-[11px] font-bold text-white uppercase truncate min-w-0 max-w-[150px] leading-tight"
      >
        {activeCart.titulo || `#${activeCart.id}`}
      </span>
    </Link>
  );
}
export default function Navbar() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Sugerencia[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [bitrixModal, setBitrixModal] = useState<Bitrix24FormKey | null>(null);
  // Estado para guardar el producto encontrado por código interno
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openSucursales } = usePublicPopups();
  const ignoreHoverRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoggedIn, selectedClient } = useSelector((state: RootState) => state.auth);
  const { items, activeCartId, openCarts, titulo } = useSelector((state: RootState) => state.cart);
  const cartItemCount = items.length;
  const activeCart = openCarts?.find((c) => c.id === activeCartId)
    ?? (activeCartId ? { id: activeCartId, titulo: titulo || undefined } : undefined);
  const [clients, setClients] = useState<any[]>([]);

  // Solo si el usuario llegó con ?login=1 (p. ej. link "Ingresar"): abrir el modal. La sesión expirada ya no usa este query.
  useEffect(() => {
    const wantsLogin = (searchParams?.get('login') || '').trim() === '1';
    if (!wantsLogin) return;

    setIsLoginModalOpen(true);

    // Limpia el query param para que no se reabra en cada navegación.
    try {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete('login');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : (pathname || '/'));
    } catch {
      // no-op
    }
  }, [searchParams, router, pathname]);

  // Fetch clients if user is Seller or Admin
  useEffect(() => {
    if (isLoggedIn && isStaff(user)) {
      getClients().then(setClients).catch(console.error);
    }
  }, [isLoggedIn, user]);

  // Enrich stale selectedClient (localStorage) with Softland CUIT once clients load.
  useEffect(() => {
    if (!selectedClient?.nrocta || selectedClient?.cuit || clients.length === 0) return;
    const match = clients.find(
      (c) => c.nrocta?.trim() === String(selectedClient.nrocta).trim(),
    );
    if (match?.cuit) {
      dispatch(setSelectedClient({ ...selectedClient, cuit: match.cuit }));
    }
  }, [clients, selectedClient, dispatch]);

  const handleClientSelect = (client: any) => {
    dispatch(setSelectedClient(client));
    // Limpia tabs + intercap_active_cart (clearCart solo vaciaba items y dejaba id stale).
    dispatch(resetStaffCartWithoutClient());

    // Persistir también en la URL para que un refresh/back mantenga el cliente activo.
    // Mantiene todos los params existentes y solo setea nrocta.
    try {
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (client?.nrocta) {
        params.set('nrocta', client.nrocta);
      } else {
        params.delete('nrocta');
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : (pathname || '/'));
    } catch {
      // no-op
    }
  };


  /** Navega a /catalogo conservando filtros actuales (rubro, marca, moto, attr_*, etc.). */
  const pushCatalogSearch = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (isStaff(user) && selectedClient?.nrocta) {
      params.set('nrocta', selectedClient.nrocta);
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (value == null || value === '') params.delete(key);
      else params.set(key, value);
    }
    params.set('page', '1');
    const qs = params.toString();
    router.push(qs ? `/catalogo?${qs}` : '/catalogo');
  };

  // Función para manejar la búsqueda - soporta código interno
  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;
    setShowSuggestions(false);

    // Verificar si es un código interno (formato: 3+ dígitos)
    if (isInternalCode(searchTerm.trim())) {
      // Extraer tippro y artcod
      const tippro = searchTerm.trim().substring(0, 3);
      const artcod = searchTerm.trim().substring(3);

      try {
        // Primero intentar buscar con el endpoint público de producto completo
        const product = await searchProductByInternalCode(searchTerm.trim());

        if (product && product.tippro && product.artcod) {
          pushCatalogSearch({
            tippro: product.tippro,
            artcod: product.artcod,
            q: null,
          });
          return;
        } else {
          // Si no se encontró, usar el endpoint de búsqueda pública con tippro y artcod
          try {
            const searchUrl = `/api/catalogo/search?tippro=${encodeURIComponent(tippro)}&artcod=${encodeURIComponent(artcod)}`;

            const response = await fetch(searchUrl, {
              method: 'GET',
              headers: getHeaders(),
            });

            if (response.ok) {
              const data = await response.json();

              // Si hay contenido, navigar con los parámetros
              if (data && data.content && data.content.length > 0) {
                const foundProduct = data.content[0];
                pushCatalogSearch({
                  tippro: foundProduct.tippro,
                  artcod: foundProduct.artcod,
                  q: null,
                });
                return;
              }
            }
          } catch (e) {
            // Silent fail
          }
        }
      } catch (error) {
        // Silent fail
      }
    }

    // Normalizar el texto de búsqueda y navegar (conserva filtros)
    const normalizedTerm = normalizeSearchText(searchTerm.trim());
    pushCatalogSearch({
      q: normalizedTerm,
      tippro: null,
      artcod: null,
    });
  };
  const handleLogout = () => {
    logoutService();
    dispatch(logoutAction());
    dispatch(clearFavorites());
    router.push('/');
  };
  // Función para verificar si el texto es un código interno (3 dígitos tipo + código producto)
  const isInternalCode = (text: string): boolean => {
    // Verificar que tenga al menos 3 dígitos y que sean solo números
    const trimmed = text.trim();
    const result = /^\d{3,}$/.test(trimmed);
    console.log('[isInternalCode] Input:', trimmed, 'Result:', result);
    return result;
  };

  // Función para normalizar el texto de búsqueda - reemplaza caracteres especiales con espacios
  const normalizeSearchText = (text: string): string => {
    if (!text) return '';
    // Reemplazar paréntesis, barras, guiones con espacios
    return text
      .replace(/[()\/\-]/g, ' ')
      .replace(/\s+/g, ' ')  // Múltiples espacios a uno solo
      .trim();
  };

  // Función para formatear el nombre del producto para mostrar
  const formatProductName = (product: any): string => {
    if (!product) return '';
    // Intentar obtener el nombre del producto de diferentes propiedades
    return product.descripcion || product.nombre || product.name || `${product.tippro}-${product.artcod}`;
  };

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(async () => {
        try {
          // Verificar si es un código interno (formato: 3 dígitos tipo + código producto)
          if (isInternalCode(searchQuery.trim())) {
            // Buscar por código interno
            const product = await searchProductByInternalCode(searchQuery.trim());
            if (product) {
              // Guardar el producto encontrado y mostrar como sugerencia
              setFoundProduct(product);
              const productName = formatProductName(product);
              setSuggestions([{ descripcion: productName, tippro: product.tippro, artcod: product.artcod }]);
              setShowSuggestions(true);
              return;
            }
          }

          // Busqueda normal por sugerencias (con texto normalizado)
          const normalizedQuery = normalizeSearchText(searchQuery.trim());
          const data = await searchProduct(normalizedQuery);
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setFoundProduct(null);
    }
  }, [searchQuery]);
  const hoverIntent = useHoverIntent({
    onOpen: () => {
      if (!ignoreHoverRef.current) setIsCatalogOpen(true);
    },
    onClose: () => setIsCatalogOpen(false),
    closeDelay: 180,
  });

  // Listen for custom event to clear search input from sidebar filters
  useEffect(() => {
    const handleClearSearch = () => {
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    };
    window.addEventListener('clear-search-input', handleClearSearch);
    return () => window.removeEventListener('clear-search-input', handleClearSearch);
  }, []);
  const publicNavLinks: NavLinkItem[] = [
    { name: '¿QUIÉNES SOMOS?', href: '/info/sobre-nosotros' },
    { name: 'QUIERO SER CLIENTE', href: '#', bitrixForm: 'solicitudCliente' },
    { name: 'SUCURSALES', href: '#', popup: 'sucursales' },
    { name: 'FORMÁ PARTE', href: '/info/forma-parte' },
  ];

  const loggedInNavLinks: NavLinkItem[] = [
    { name: 'CARRITOS', href: '/carrito' },
    { name: 'PEDIDOS Y SEGUIMIENTO', href: '/pedidos' },
    ...(canAccessCuentaCorriente(user) ? [{ name: 'CUENTA CORRIENTE', href: '/cuenta-corriente' }] : []),
    { name: 'COBRÁ CON INPAY', href: '/cobra-con-inpay' },
    { name: 'RECLAMOS', href: '#', bitrixForm: 'sugerenciasReclamos' },
  ];

  const ayudaHref = '/info/ayuda-rapida';
  const ayudaActive = isNavLinkActive(pathname || '/', ayudaHref);

  const navLinks = isLoggedIn ? loggedInNavLinks : publicNavLinks;
  const catalogNavActive = isCatalogNavActive(pathname || '/');

  const secondaryNavLinkClass = (href: string, highlight?: boolean) => {
    const active = isNavLinkActive(pathname || '/', href);
    if (active) {
      return 'bg-white/15 text-white';
    }
    if (highlight) {
      return 'text-[#0e8c85] hover:brightness-110';
    }
    return 'text-white/90 hover:bg-white/10 hover:text-white';
  };

  const openBitrixForm = (formKey: Bitrix24FormKey) => setBitrixModal(formKey);

  const renderSecondaryNavItem = (link: NavLinkItem) => {
    const className = `
      px-3 py-1.5 rounded-md
      text-[10px] md:text-[11px] font-bold whitespace-nowrap uppercase tracking-wide transition-all shrink-0
      ${secondaryNavLinkClass(link.href, link.highlight)}
    `;

    if (link.bitrixForm) {
      return (
        <button
          key={link.name}
          type="button"
          onClick={() => openBitrixForm(link.bitrixForm!)}
          className={className}
        >
          {link.name}
        </button>
      );
    }

    if (link.popup === 'sucursales') {
      return (
        <button
          key={link.name}
          type="button"
          onClick={openSucursales}
          className={className}
        >
          {link.name}
        </button>
      );
    }

    return (
      <Link key={link.name} href={link.href} className={className}>
        {link.name}
      </Link>
    );
  };

  return (
    <header
      className="sticky top-0 z-[9999] w-full text-white shadow-lg"
    >
      <div style={{ backgroundColor: CORPORATE_PURPLE }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="md:hidden">
          <div className="flex items-center justify-between py-3 gap-2">
            <Link href="/" className="flex-shrink-0">
              <img
                src="/images/Intercap-Blanco.png"
                alt="e-biz INTERCAP"
                className="h-5 w-auto"
              />
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              {isLoggedIn ? (
                <>
                  <SaldoVencidoBell compact />
                  <Link
                    href={ayudaHref}
                    aria-label="Ayuda"
                    aria-current={ayudaActive ? 'page' : undefined}
                    className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                      ayudaActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(true)}
                    aria-label="Abrir menú"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </>
              ) : (
                  <>
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      style={{ backgroundColor: ACTION_BLUE }}
                      className="px-2 py-1.5 rounded text-[9px] font-bold uppercase whitespace-nowrap"
                    >
                      Ingresá
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMobileNavOpen(true)}
                      aria-label="Abrir menú"
                      className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors"
                    >
                      <Menu className="h-6 w-6" />
                    </button>
                  </>
                )}
            </div>
          </div>

          <div className="relative w-full pb-3 border-t border-white/10 pt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="¿Qué estás buscando?"
                className="w-full  bg-white py-2 px-6 pr-12 rounded-full text-gray-800 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => searchQuery.trim().length > 2 && setShowSuggestions(true)}
              />
              <Search
                className="absolute  bg-white right-4 top-2 h-5 w-5 cursor-pointer text-gray-400"
                onClick={() => handleSearch()}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[10000] max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // Si la sugerencia tiene tippro y artcod, usarlos para búsqueda exacta
                        // Nota: el backend puede devolver 'artcod' o 'artdcod' (typo)
                        const tippro = suggestion.tippro || '';
                        const artcod = suggestion.artcod || suggestion.artdcod || '';
                        setShowSuggestions(false);
                        pushCatalogSearch({
                          tippro: tippro || null,
                          artcod: artcod || null,
                          q: null,
                        });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800 text-sm"
                    >
                      {suggestion.descripcion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isLoggedIn && (
              <div className="flex justify-end pt-2 md:hidden">
                <CotizacionDolarLabel variant="compact" />
              </div>
            )}
          </div>
        </div>
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center gap-x-4 lg:gap-x-6 py-3.5">
          <div className="flex items-center gap-3 lg:gap-4 shrink-0">
            <Link href="/" className="flex-shrink-0">
              <img
                src="/images/Intercap-Blanco.png"
                alt="e-biz INTERCAP"
                className="h-7 w-auto"
              />
            </Link>
            {isLoggedIn && (
              <NavSwitch activePath={pathname || '/'} />
            )}
          </div>

          <div className="flex justify-center min-w-0 px-2 lg:px-6">
            <div className="relative w-full max-w-xl">
              <input
                type="text"
                placeholder="¿Qué estás buscando?"
                className="w-full py-2 px-6 pr-12 bg-white rounded-full text-gray-800 text-sm focus:ring-2 focus:ring-[#0e8c85] outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => searchQuery.trim().length > 2 && setShowSuggestions(true)}
              />
              <Search
                className="absolute right-4 top-2 h-5 w-5 cursor-pointer text-gray-400"
                onClick={() => handleSearch()}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[10000] max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const tippro = suggestion.tippro || '';
                        const artcod = suggestion.artcod || suggestion.artdcod || '';
                        setShowSuggestions(false);
                        pushCatalogSearch({
                          tippro: tippro || null,
                          artcod: artcod || null,
                          q: null,
                        });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800 text-sm"
                    >
                      {suggestion.descripcion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 justify-end shrink-0">
            {isLoggedIn ? (
              <>
                <ActiveCartWidget
                  activeCart={activeCart}
                  cartItemCount={cartItemCount}
                />
                <div className="hidden lg:block text-sm font-bold text-white truncate max-w-[120px] xl:max-w-[160px]">
                  {user?.nombre}
                </div>
                <UserProfileMenu onLogout={handleLogout} />
                <SaldoVencidoBell />
                <Link
                  href={ayudaHref}
                  aria-current={ayudaActive ? 'page' : undefined}
                  className={`hidden lg:flex items-center gap-1.5 text-[11px] font-bold uppercase transition-colors ${
                    ayudaActive ? 'text-white' : 'text-white/80 hover:text-white'
                  }`}
                >
                  AYUDA
                  <HelpCircle className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  style={{ backgroundColor: ACTION_BLUE }}
                  className="px-4 py-2 rounded text-[11px] font-bold uppercase whitespace-nowrap hover:brightness-110 active:scale-95 transition-all"
                >
                  Ingresá
                </button>
                <button
                  onClick={() => openBitrixForm('solicitudCliente')}
                  style={{ backgroundColor: ACTION_BLUE }}
                  className="px-4 py-2 rounded text-[11px] font-bold uppercase whitespace-nowrap hover:brightness-110 active:scale-95 transition-all hidden sm:block"
                >
                  Solicitá Acceso
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      <div
        style={{ backgroundColor: CORPORATE_PURPLE_DARK }}
        className="hidden md:block border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4">
        <nav className="hidden md:grid grid-cols-[auto_1fr_auto] items-center gap-x-4 lg:gap-x-6 py-2.5">
          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide min-w-0 col-start-1">
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsMobileCatalogOpen(true);
              }
            }}
            {...hoverIntent}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-md
              text-[10px] md:text-[11px] font-bold whitespace-nowrap uppercase tracking-wide
              transition-all shrink-0
              ${isCatalogOpen || catalogNavActive
                ? 'bg-white/15 text-white'
                : 'text-white/90 hover:bg-white/10 hover:text-white'}
            `}
          >
            CATÁLOGO
            <ChevronDown
              className={`h-3 w-3 transition-transform ${isCatalogOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {navLinks.map((link) => renderSecondaryNavItem(link))}
          </div>
          {isLoggedIn && (
            <div className="col-start-3 flex items-center justify-end gap-3 shrink-0 min-w-0">
              {isStaff(user) && (
                <ClientSelector
                  clients={clients}
                  selectedClient={selectedClient}
                  onSelect={handleClientSelect}
                  variant="nav"
                />
              )}
              <CotizacionDolarLabel />
            </div>
          )}
        </nav>
        <div className="hidden md:block relative">
          <AnimatePresence>
            {isCatalogOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-full left-1/2 -translate-x-1/2 z-[50] mt-1"
                {...hoverIntent}
              >
                <CatalogMegaMenu onNavigate={() => {
                  setSearchQuery('');
                  setIsCatalogOpen(false);
                  ignoreHoverRef.current = true;
                  setTimeout(() => {
                    ignoreHoverRef.current = false;
                  }, 500);
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        links={navLinks}
        pathname={pathname || '/'}
        onCatalogClick={() => setIsMobileCatalogOpen(true)}
        onBitrixFormClick={openBitrixForm}
        onSucursalesClick={openSucursales}
      />
      <AnimatePresence>
        {isMobileCatalogOpen && (
          <CatalogMobileMenu onClose={() => setIsMobileCatalogOpen(false)} onNavigate={() => setSearchQuery('')} />
        )}
      </AnimatePresence>
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      >
        <ModalLogin onClose={() => setIsLoginModalOpen(false)} />
      </Modal>
      <Bitrix24FormModal
        formKey={bitrixModal}
        isOpen={bitrixModal !== null}
        onClose={() => setBitrixModal(null)}
      />
    </header>
  );
}
