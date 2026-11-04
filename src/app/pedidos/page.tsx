'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import DashboardShell from '@/components/home/DashboardShell';
import PedidosSeguimientoSection from '@/components/pedidos/PedidosSeguimientoSection';

export default function PedidosPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (isLoading) return;
    const token = localStorage.getItem('authToken');
    if (!isLoggedIn || !token) {
      router.replace('/?login=1');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) return null;

  return (
    <DashboardShell>
      <div className="min-h-full bg-[#eef1f4] p-4 lg:p-6">
        <PedidosSeguimientoSection />
      </div>
    </DashboardShell>
  );
}
