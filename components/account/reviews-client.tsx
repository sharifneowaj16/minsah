'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Star, Edit, Trash2, Search, Plus, Eye, Heart, MessageCircle, Check, X, ShoppingBag } from 'lucide-react';
import { Star as StarSolid } from 'lucide-react';

interface ReviewsClientProps {
  reviews: any[];
  reviewableProducts: any[];
}

export function ReviewsClient({ reviews: initialReviews, reviewableProducts }: ReviewsClientProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filteredReviews, setFilteredReviews] = useState(initialReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateDesc');
  const [activeTab, setActiveTab] = useState('my-reviews');

  const tabs = [
    { id: 'my-reviews', name: 'My Reviews', count: reviews.length },
    { id: 'write-review', name: 'Write Review', count: reviewableProducts.length }
  ];

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      setReviews(prev => prev.filter(review => review.id !== reviewId));
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          i < rating ? (
            <StarSolid key={i} className="w-5 h-5 text-yellow-400 fill-current" />
          ) : (
            <Star key={i} className="w-5 h-5 text-gray-300" />
          )
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reviews</h1>
          <p className="text-gray-600">Manage your product reviews</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'my-reviews' && (
          <div>
            {filteredReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No reviews found</h3>
                <p className="text-gray-600 mb-6">You haven't written any reviews yet</p>
                <button
                  onClick={() => setActiveTab('write-review')}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Write Your First Review
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                          {review.productImage}
                        </div>
                        <div>
                          <Link href={`/products/${review.productId}`} className="text-lg font-medium hover:text-purple-600">
                            {review.productName}
                          </Link>
                          <div className="flex items-center space-x-4 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600">{review.createdAt.toLocaleDateString()}</span>
                            {review.isVerified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Eye className="w-3 h-3 mr-1" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-600 hover:text-purple-600 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteReview(review.id)} className="p-2 text-gray-600 hover:text-red-600 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium">{review.title}</h3>
                      <p className="text-gray-700">{review.content}</p>
                    </div>
                    <div className="flex items-center space-x-6 mt-4 pt-4 border-t">
                      <div className="flex items-center text-sm text-gray-600">
                        <Heart className="w-4 h-4 mr-1" />
                        {review.helpfulCount} helpful
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        0 comments
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'write-review' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Products to Review</h2>
              {reviewableProducts.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No products to review</h3>
                  <p className="text-gray-600 mb-6">Once you make a purchase, you can review the products here</p>
                  <Link href="/shop" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviewableProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                          {product.image}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-600">Purchased: {product.orderDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Link
                        href={`/account/reviews/write?productId=${product.id}`}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Write Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Guidelines */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Review Guidelines</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-gray-700">Be honest and detailed in your review</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-gray-700">Include information about product quality and results</p>
                </div>
                <div className="flex items-start space-x-3">
                  <X className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-gray-700">Don't include personal information</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
