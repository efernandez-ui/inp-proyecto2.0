'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { canAccessCuentaCorriente } from '@/utils/auth';
import DashboardShell from '@/components/home/DashboardShell';
import InPaySection from '@/components/inpay/InPaySection';

export default function CobraConInpayPage() {
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
        <InPaySection />
      </div>
    </DashboardShell>
  );
}
