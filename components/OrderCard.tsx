'use client';

import { Order } from '@/lib/types';

interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  onClick: () => void;
}

export default function OrderCard({ order, isSelected, onClick }: OrderCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-5 mb-3 rounded-xl border-2 cursor-pointer transition-all
        ${isSelected
          ? 'border-blue-500 bg-slate-700 shadow-lg shadow-blue-500/20'
          : 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:shadow-md'
        }
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-400 bg-blue-950 px-3 py-1 rounded-full">
              Order #{order.orderNumber}
            </span>
            <span className="text-xs text-yellow-400 bg-yellow-950 px-3 py-1 rounded-full">
              Pending
            </span>
          </div>
          <h3 className="font-semibold text-slate-100 text-lg text-center">
            {order.customerName}
          </h3>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-600">
        <span className="text-xl font-bold text-green-400">
          {order.currency} ${order.totalAmount}
        </span>
        <span className="text-sm text-slate-400">
          {formatDate(order.orderDate)}
        </span>
      </div>
    </div>
  );
}

