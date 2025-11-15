'use client';

import { Order } from '@/lib/types';
import OrderCard from './OrderCard';

interface OrderListProps {
  orders: Order[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order) => void;
}

export default function OrderList({ orders, selectedOrder, onSelectOrder }: OrderListProps) {
  // Sort orders by date (newest first)
  const sortedOrders = [...orders].sort((a, b) => {
    return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-700 bg-slate-800">
        <h2 className="text-2xl font-bold text-slate-100 text-center">Pending Orders</h2>
        <p className="text-sm text-slate-400 mt-2 text-center">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} waiting
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-slate-600 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium text-lg">No pending orders</p>
            <p className="text-slate-500 text-sm mt-2">Orders will appear here when received from n8n</p>
          </div>
        ) : (
          sortedOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              isSelected={selectedOrder?.orderId === order.orderId}
              onClick={() => onSelectOrder(order)}
            />
          ))
        )}
      </div>
    </div>
  );
}

