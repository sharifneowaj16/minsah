'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth, PERMISSIONS } from '@/contexts/AdminAuthContext';
import {
  Search,
  Filter,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  FileText,
  UserPlus,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatPrice, convertUSDtoBDT } from '@/utils/currency';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  joinDate: string;
  lastLogin?: string;
  status: 'active' | 'inactive' | 'suspended';
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategories: string[];
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  marketing: {
    emailConsent: boolean;
    smsConsent: boolean;
  };
  tags: string[];
  notes?: string;
}

interface CustomerFilters {
  search: string;
  status: string;
  joinDateRange: string;
  totalOrders: string;
  totalSpent: string;
  sortBy: string;
}

export default function CustomersPage() {
  const { hasPermission } = useAdminAuth();
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 234-567-8901',
      avatar: '/avatars/sarah.jpg',
      joinDate: '2023-06-15',
      lastLogin: '2024-01-15',
      status: 'active',
      totalOrders: 12,
      totalSpent: 1245.67,
      averageOrderValue: 103.81,
      favoriteCategories: ['Skin care', 'Make Up'],
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'United States',
      },
      marketing: {
        emailConsent: true,
        smsConsent: false,
      },
      tags: ['VIP', 'Regular'],
    },
    {
      id: '2',
      name: 'Emma Davis',
      email: 'emma.d@email.com',
      phone: '+1 234-567-8902',
      joinDate: '2023-08-22',
      lastLogin: '2024-01-14',
      status: 'active',
      totalOrders: 8,
      totalSpent: 567.89,
      averageOrderValue: 70.99,
      favoriteCategories: ['Hair care', 'Perfume'],
      address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        country: 'United States',
      },
      marketing: {
        emailConsent: true,
        smsConsent: true,
      },
      tags: ['New'],
    },
    {
      id: '3',
      name: 'Ol Wilson',
      email: 'ol.w@email.com',
      joinDate: '2023-12-01',
      status: 'inactive',
      totalOrders: 2,
      totalSpent: 134.98,
      averageOrderValue: 67.49,
      favoriteCategories: ['Nails'],
      address: {
        street: '123 Main St',
        city: 'Boston',
        state: 'MA',
        country: 'United States',
      },
      marketing: {
        emailConsent: false,
        smsConsent: false,
      },
      tags: ['Inactive'],
    },
    {
      id: '4',
      name: 'Maria Garcia',
      email: 'maria.g@email.com',
      phone: '+1 234-567-8903',
      avatar: '/avatars/maria.jpg',
      joinDate: '2022-03-10',
      lastLogin: '2024-01-13',
      status: 'active',
      totalOrders: 25,
      totalSpent: 3456.78,
      averageOrderValue: 138.27,
      favoriteCategories: ['Make Up', 'SPA', 'Perfume'],
      address: {
        street: '789 Pine St',
        city: 'Chicago',
        state: 'IL',
        country: 'United States',
      },
      marketing: {
        emailConsent: true,
        smsConsent: false,
      },
      tags: ['VIP', 'Wholesale'],
      notes: 'Prefers organic products',
    },
    {
      id: '5',
      name: 'Lisa Chen',
      email: 'lisa.c@email.com',
      avatar: '/avatars/lisa.jpg',
      joinDate: '2023-11-15',
      status: 'suspended',
      totalOrders: 1,
      totalSpent: 456.80,
      averageOrderValue: 456.80,
      favoriteCategories: ['Perfume'],
      address: {
        street: '456 Oak St',
        city: 'Seattle',
        state: 'WA',
        country: 'United States',
      },
      marketing: {
        emailConsent: false,
        smsConsent: false,
      },
      tags: ['Suspended'],
    },
  ]);

  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: '',
    joinDateRange: '',
    totalOrders: '',
    totalSpent: '',
    sortBy: 'joinDate',
  });
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  if (!hasPermission(PERMISSIONS.CUSTOMERS_VIEW)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to view customers.</p>
      </div>
    );
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      (customer.phone && customer.phone.includes(filters.search));
    const matchesStatus = !filters.status || customer.status === filters.status;

    // Additional filter logic can be added here
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'orders':
        return b.totalOrders - a.totalOrders;
      case 'spent':
        return b.totalSpent - a.totalSpent;
      case 'lastLogin':
        if (!a.lastLogin) return 1;
        if (!b.lastLogin) return -1;
        return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
      case 'joinDate':
      default:
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    }
  };

  const handleBulkEmail = () => {
    const selectedCustomerEmails = filteredCustomers
      .filter(c => selectedCustomers.includes(c.id) && c.marketing.emailConsent)
      .map(c => c.email);

    alert(`Would send email to: ${selectedCustomerEmails.join(', ')}`);
  };

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateAgo = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer base and relationships</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <FileText className="w-5 h-5 mr-2" />
            Export
          </button>
          {hasPermission(PERMISSIONS.CUSTOMERS_EDIT) && (
            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
              <UserPlus className="w-5 h-5 mr-2" />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {showFilters && <Layers className="w-4 h-4 ml-2 text-purple-600" />}
          </button>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="joinDate">Join Date</option>
            <option value="name">Name</option>
            <option value="orders">Total Orders</option>
            <option value="spent">Total Spent</option>
            <option value="lastLogin">Last Login</option>
          </select>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
              <select
                value={filters.joinDateRange}
                onChange={(e) => setFilters({ ...filters, joinDateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Orders</label>
              <select
                value={filters.totalOrders}
                onChange={(e) => setFilters({ ...filters, totalOrders: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="0">0 Orders</option>
                <option value="1-5">1-5 Orders</option>
                <option value="6-10">6-10 Orders</option>
                <option value="10+">10+ Orders</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Spent</label>
              <select
                value={filters.totalSpent}
                onChange={(e) => setFilters({ ...filters, totalSpent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Any Amount</option>
                <option value="0-12000">$0 - $12,000</option>
                <option value="12000-60000">$12,000 - $60,000</option>
                <option value="60000-120000">$60,000 - $120,000</option>
                <option value="120000+">$120,000+</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {selectedCustomers.length} customer{selectedCustomers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedCustomers([])}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
              <button
                onClick={handleBulkEmail}
                className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
              >
                <Mail className="w-4 h-4 mr-1" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={(e) => handleSelectCustomer(customer.id, e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        {customer.avatar ? (
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`text-purple-600 font-semibold text-sm ${customer.avatar ? 'hidden' : ''}`}>
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                        {customer.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            {customer.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(customer.status)
                    )}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.totalOrders}</div>
                    <div className="text-xs text-gray-500">Avg: {formatPrice(convertUSDtoBDT(customer.averageOrderValue))}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{formatPrice(convertUSDtoBDT(customer.totalSpent))}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(customer.joinDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDateAgo(customer.lastLogin)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="text-purple-600 hover:text-purple-800" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasPermission(PERMISSIONS.CUSTOMERS_EDIT) && (
                        <button className="text-blue-600 hover:text-blue-800" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {customer.email && (
                        <button className="text-green-600 hover:text-green-800" title="Send Email">
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission(PERMISSIONS.CUSTOMERS_DELETE) && (
                        <button className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
