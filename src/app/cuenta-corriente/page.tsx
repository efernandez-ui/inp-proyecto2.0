'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { canAccessCuentaCorriente } from '@/utils/auth';
import CuentaCorrienteSection from '@/components/cuenta-corriente/CuentaCorrienteSection';
import DashboardShell from '@/components/home/DashboardShell';

export default function CuentaCorrientePage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (isLoading) return;
    const token = localStorage.getItem('authToken');
    if (!isLoggedIn || !token) {
      router.replace('/?login=1');
      return;
    }
    if (!canAccessCuentaCorriente(user)) {
      router.replace('/');
    }
  }, [isLoading, isLoggedIn, user, router]);

  if (isLoading || !isLoggedIn || !canAccessCuentaCorriente(user)) return null;

  return (
    <DashboardShell>
      <div className="p-4 lg:p-6">
        <CuentaCorrienteSection />
      </div>
    </DashboardShell>
  );
}
