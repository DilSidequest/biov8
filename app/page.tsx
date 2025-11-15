'use client';

import { useState, useEffect } from 'react';
import OrderList from '@/components/OrderList';
import OrderDetails from '@/components/OrderDetails';
import { Order } from '@/lib/types';
import { orderStore } from '@/lib/store';

export default function Home() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Load orders from localStorage on mount
  useEffect(() => {
    orderStore.loadFromLocalStorage();
    setPendingOrders(orderStore.getOrders());

    // Subscribe to order changes
    const unsubscribe = orderStore.subscribe(() => {
      setPendingOrders(orderStore.getOrders());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Poll for new orders from n8n
  useEffect(() => {
    const pollForOrders = async () => {
      try {
        const response = await fetch('/api/receive-order');
        if (response.ok) {
          const data = await response.json();
          if (data.orders && data.orders.length > 0) {
            data.orders.forEach((order: Order) => {
              orderStore.addOrder(order);
            });
          }
        }
      } catch (error) {
        console.error('Error polling for orders:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollForOrders, 3000);

    // Also poll immediately on mount
    pollForOrders();

    return () => clearInterval(interval);
  }, []);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleSubmitSuccess = (orderId: string) => {
    // Remove order from store
    orderStore.removeOrder(orderId);
    
    // Clear selected order
    setSelectedOrder(null);

    // Auto-select next order if available
    const remainingOrders = orderStore.getOrders();
    if (remainingOrders.length > 0) {
      setSelectedOrder(remainingOrders[0]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center">Doctor&apos;s Order Portal</h1>
          <p className="text-blue-100 text-sm mt-2 text-center">Manage and process prescription orders</p>
        </div>
      </header>

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Order List */}
        <div className="w-1/3 border-r border-slate-700 overflow-hidden bg-slate-800">
          <OrderList
            orders={pendingOrders}
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

