'use client';

import { useState } from 'react';
import { Order } from '@/lib/types';

interface SearchPanelProps {
  selectedOrder: Order | null;
  onSelectOrder: (order: Order) => void;
}

interface SearchResult {
  customerId: number;
  email: string;
  name: string;
  customerCreatedAt: string;
  orders: Order[];
}

export default function SearchPanel({ selectedOrder, onSelectOrder }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a name or email to search');
      return;
    }

    setIsSearching(true);
    setError('');
    setHasSearched(true);

    try {
      console.log('[SearchPanel] Searching for:', searchQuery);
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      console.log('[SearchPanel] Search results:', data);
      
      setSearchResults(data.results || []);
      
      if (data.results.length === 0) {
        setError('No customers found matching your search');
      }
    } catch (err) {
      console.error('[SearchPanel] Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    setHasSearched(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-6 border-b border-slate-700 bg-slate-800">
        <h2 className="text-xl font-bold text-white mb-4">🔍 Search</h2>
        
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter name or email..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSearching}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            
            {hasSearched && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasSearched && (
          <div className="text-center text-slate-400 mt-8">
            <p className="text-lg">👆 Search for a patient by name or email</p>
            <p className="text-sm mt-2">Enter the patient&apos;s name or email address to view their order history</p>
          </div>
        )}

        {hasSearched && searchResults.length === 0 && !error && !isSearching && (
          <div className="text-center text-slate-400 mt-8">
            <p className="text-lg">No results found</p>
            <p className="text-sm mt-2">Try searching with a different name or email</p>
          </div>
        )}

        {searchResults.map((customer) => (
          <div key={customer.customerId} className="mb-6">
            {/* Customer Header */}
            <div className="bg-slate-700 p-4 rounded-t-lg border border-slate-600">
              <h3 className="text-lg font-bold text-white">{customer.name}</h3>
              <p className="text-sm text-slate-300">{customer.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Customer since: {new Date(customer.customerCreatedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Orders List */}
            <div className="bg-slate-800 border-x border-b border-slate-600 rounded-b-lg">
              {customer.orders.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                  No orders found for this customer
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {customer.orders.map((order) => (
                    <button
                      key={order.orderId}
                      onClick={() => onSelectOrder(order)}
                      className={`w-full p-4 text-left hover:bg-slate-700 transition-colors ${
                        selectedOrder?.orderId === order.orderId ? 'bg-blue-900/30 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white">Order #{order.orderNumber}</p>
                          <p className="text-sm text-slate-300 mt-1">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                          {order.totalAmount && (
                            <p className="text-sm text-green-400 mt-1">
                              {order.currency} {order.totalAmount}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            View
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

