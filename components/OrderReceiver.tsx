'use client';

import { useEffect } from 'react';
import { orderStore } from '@/lib/store';
import { Order } from '@/lib/types';

export default function OrderReceiver() {
  useEffect(() => {
    // Set up a polling mechanism to check for new orders
    // This simulates receiving orders from n8n
    const checkForOrders = async () => {
      try {
        // In a real implementation, this would poll an endpoint
        // or use Server-Sent Events / WebSockets
        // For now, orders are added directly via the store when n8n calls /api/orders
      } catch (error) {
        console.error('Error checking for orders:', error);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkForOrders, 5000);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}

