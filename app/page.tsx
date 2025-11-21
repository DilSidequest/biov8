'use client';

import { useState } from 'react';
import SearchPanel from '@/components/SearchPanel';
import OrderDetails from '@/components/OrderDetails';
import { Order } from '@/lib/types';

export default function Home() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleSubmitSuccess = (orderId: string) => {
    console.log(`[Home] Prescription submitted for order ${orderId}`);
    // Clear selected order after successful submission
    setSelectedOrder(null);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center">Doctor&apos;s Prescription Portal</h1>
          <p className="text-blue-100 text-sm mt-2 text-center">Search patients and manage prescriptions</p>
        </div>
      </header>

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Search */}
        <div className="w-1/3 border-r border-slate-700 overflow-hidden bg-slate-800">
          <SearchPanel
            selectedOrder={selectedOrder}
            onSelectOrder={handleSelectOrder}
          />
        </div>

        {/* Right Panel - Order Details */}
        <div className="flex-1 overflow-hidden bg-slate-900">
          <OrderDetails
            order={selectedOrder}
            onSubmitSuccess={handleSubmitSuccess}
          />
        </div>
      </div>
    </div>
  );
}

