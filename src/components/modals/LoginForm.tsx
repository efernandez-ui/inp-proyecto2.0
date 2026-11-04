'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff } from 'lucide-react';
import { login as loginService, getProfile } from '../../services/auth';
import { login as loginAction } from '../../store/authSlice';
import { loadCotizacionDolar } from '../../utils/loadCotizacionDolar';
import type { AppDispatch } from '../../store';
interface LoginFormProps {
  onClose: () => void;
}
export default function LoginForm({ onClose }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginService(username, password);
      const user = await getProfile();
      dispatch(loginAction(user));
      await loadCotizacionDolar(dispatch);
      onClose();
      router.push('/');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-center mb-4">Iniciar Sesión</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="
  mt-1 block w-full px-3 py-2
  border border-gray-300 rounded-md shadow-sm
  bg-white text-gray-900
  dark:bg-gray-800 dark:text-white dark:border-gray-600
  focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="
  block w-full px-3 py-2 pr-10
  border border-gray-300 rounded-md shadow-sm
  bg-white text-gray-900
  dark:bg-gray-800 dark:text-white dark:border-gray-600
  focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-800"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}
