'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  ShoppingBag,
  X,
  Star,
  Filter,
  Search,
  Sparkles,
  Brush,
  Eye,
  Package
} from 'lucide-react';
import { Heart as HeartSolid } from 'lucide-react';

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage: any;
  price: number;
  originalPrice: number | null;
  inStock: boolean;
  addedAt: Date;
  category: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  restockDate?: Date;
}

interface WishlistClientProps {
  initialItems: WishlistItem[];
}

export function WishlistClient({ initialItems }: WishlistClientProps) {
  const [wishlistItems, setWishlistItems] = useState(initialItems);
  const [filteredItems, setFilteredItems] = useState(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(initialItems.map(item => item.category)))];

  useEffect(() => {
    let filtered = [...wishlistItems];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Sort items
    switch (sortBy) {
      case 'dateAdded':
        filtered.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
        break;
      case 'priceLow':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceHigh':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredItems(filtered);
  }, [wishlistItems, searchTerm, categoryFilter, sortBy]);

  const handleRemoveItem = (itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  const handleRemoveSelected = () => {
    setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const handleMoveToCart = (productId: string) => {
    // In a real app, this would add the item to the cart
    console.log('Moving item to cart:', productId);
    // You could show a toast notification here
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
              <p className="text-gray-600">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
                <button
                  onClick={handleRemoveSelected}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search wishlist items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="dateAdded">Date Added</option>
                <option value="name">Name</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || categoryFilter !== 'all'
                ? 'No items found'
                : 'Your wishlist is empty'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start adding items to your wishlist to keep track of products you love'}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Checkbox */}
            {filteredItems.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredItems.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Select all items</span>
                </label>
              </div>
            )}

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="relative">
                    <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      {item.productImage}
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-2">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                      <label className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedItems.includes(item.id)
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedItems.includes(item.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Discount Badge */}
                    {item.discount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        -{item.discount}%
                      </div>
                    )}

                    {/* Out of Stock Overlay */}
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white rounded-lg p-4 text-center">
                          <p className="text-gray-900 font-medium mb-1">Out of Stock</p>
                          {item.restockDate && (
                            <p className="text-sm text-gray-600">
                              Expected: {item.restockDate.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {item.productName}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(item.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {item.rating} ({item.reviewCount})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button className="p-2 text-red-500 hover:bg-red-50 rounded-full transition">
                        {selectedItems.includes(item.id) ? (
                          <HeartSolid className="w-5 h-5 fill-current" />
                        ) : (
                          <Heart className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMoveToCart(item.productId)}
                        disabled={!item.inStock}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                          item.inStock
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                      <Link
                        href={`/products/${item.productId}`}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
