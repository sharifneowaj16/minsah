'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth, PERMISSIONS } from '@/contexts/AdminAuthContext';
import {
  Search,
  Filter,
  Eye,
  Truck,
  FileText,
  Download,
  Mail,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatPrice, convertUSDtoBDT } from '@/utils/currency';

interface Order {
  id: string;
  dbId?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  tracking?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface OrderFilters {
  search: string;
  status: string;
  paymentStatus: string;
  dateRange: string;
  sortBy: string;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const paymentStatusOptions = [
  { value: '', label: 'All Payment Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const sortOptions = [
  { value: 'created', label: 'Date Created' },
  { value: 'updated', label: 'Last Updated' },
  { value: 'total_high', label: 'Total: High to Low' },
  { value: 'total_low', label: 'Total: Low to High' },
  { value: 'customer', label: 'Customer Name' },
];

export default function OrdersPage() {
  const { hasPermission } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, processing: 0, shipped: 0, totalRevenue: 0 });

  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: '',
    paymentStatus: '',
    dateRange: '',
    sortBy: 'created',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    isOpen: boolean;
    orderId: string;
    currentStatus: string;
  }>({
    isOpen: false,
    orderId: '',
    currentStatus: '',
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
      if (filters.dateRange) params.set('dateRange', filters.dateRange);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch orders');
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || { pending: 0, processing: 0, shipped: 0, totalRevenue: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (hasPermission(PERMISSIONS.ORDERS_VIEW)) {
      fetchOrders();
    }
  }, [fetchOrders, hasPermission]);

  if (!hasPermission(PERMISSIONS.ORDERS_VIEW)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don&apos;t have permission to view orders.</p>
      </div>
    );
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update order');
      }

      const data = await res.json();

      // Update local state optimistically
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: data.order.status as Order['status'],
                tracking: data.order.tracking || order.tracking,
                updatedAt: data.order.updatedAt,
              }
            : order
        )
      );
      setStatusUpdateModal({ isOpen: false, orderId: '', currentStatus: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <RefreshCw className={clsx('w-5 h-5 mr-2', loading && 'animate-spin')} />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
            <FileText className="w-5 h-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Processing', value: stats.processing, color: 'text-blue-600' },
          { label: 'Shipped', value: stats.shipped, color: 'text-purple-600' },
          { label: 'Revenue', value: formatPrice(convertUSDtoBDT(stats.totalRevenue)), color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={clsx('text-2xl font-bold mt-1', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by ID, customer name, or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {showFilters && <Layers className="w-4 h-4 ml-2 text-purple-600" />}
          </button>

          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {paymentStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-2 text-sm text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="ml-3 text-gray-500">Loading orders...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-xs text-gray-500">{order.customer.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.items.length} items</div>
                      {order.notes && (
                        <div className="text-xs text-blue-600 italic">Has notes</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{formatPrice(convertUSDtoBDT(order.total))}</div>
                      <div className="text-xs text-gray-500 capitalize">{order.paymentMethod.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(order.status)
                      )}>
                        {order.status}
                      </span>
                      {order.tracking && (
                        <div className="text-xs text-gray-500 mt-1">
                          Tracking: {order.tracking}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getPaymentStatusColor(order.paymentStatus)
                      )}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      <div className="text-xs text-gray-500">Updated: {formatDate(order.updatedAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setStatusUpdateModal({
                              isOpen: true,
                              orderId: order.id,
                              currentStatus: order.status,
                            });
                          }}
                          className="text-purple-600 hover:text-purple-800"
                          title="Update Status"
                          disabled={!hasPermission(PERMISSIONS.ORDERS_PROCESS)}
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-800" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800" title="Email Customer">
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {statusUpdateModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order ID: {statusUpdateModal.orderId}
            </p>
            <div className="space-y-3">
              {statusOptions.slice(1).map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusUpdate(statusUpdateModal.orderId, option.value as Order['status'])}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-lg border transition-colors duration-200',
                    statusUpdateModal.currentStatus === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStatusUpdateModal({ isOpen: false, orderId: '', currentStatus: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
