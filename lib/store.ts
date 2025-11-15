'use client';

import { Order } from './types';

// In-memory store for orders
let ordersStore: Order[] = [];
let listeners: Array<() => void> = [];

export const orderStore = {
  getOrders: (): Order[] => {
    return ordersStore;
  },

  addOrder: (order: Order): void => {
    // Check if order already exists
    const existingIndex = ordersStore.findIndex(o => o.orderId === order.orderId);
    
    if (existingIndex >= 0) {
      // Update existing order
      ordersStore[existingIndex] = order;
    } else {
      // Add new order
      ordersStore.push(order);
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingOrders', JSON.stringify(ordersStore));
    }
    
    // Notify listeners
    listeners.forEach(listener => listener());
  },

  removeOrder: (orderId: string): void => {
    ordersStore = ordersStore.filter(o => o.orderId !== orderId);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingOrders', JSON.stringify(ordersStore));
    }
    
    // Notify listeners
    listeners.forEach(listener => listener());
  },

  loadFromLocalStorage: (): void => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pendingOrders');
      if (saved) {
        try {
          ordersStore = JSON.parse(saved);
          listeners.forEach(listener => listener());
        } catch (error) {
          console.error('Failed to load orders from localStorage:', error);
        }
      }
    }
  },

  subscribe: (listener: () => void): (() => void) => {
    listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  clearAll: (): void => {
    ordersStore = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingOrders');
    }
    listeners.forEach(listener => listener());
  }
};

