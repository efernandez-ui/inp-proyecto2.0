'use client';

import CartView from '@/components/cart/CartView';
import DashboardShell from '@/components/home/DashboardShell';

export default function CarritoPage() {
  return (
    <DashboardShell>
      <div className="min-h-full bg-white p-4 lg:p-6">
        <CartView />
      </div>
    </DashboardShell>
  );
}
