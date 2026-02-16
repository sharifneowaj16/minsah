'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Navbar from '../../components/Header';
import TopBar from '../../components/TopBar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { ShoppingCart, Heart, Minus, Plus, ArrowLeft, Star } from 'lucide-react';
import { formatPrice, convertUSDtoBDT } from '@/utils/currency';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const isUrl = src && (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:'));
  if (isUrl) {
    return <img src={src} alt={alt} className="w-full h-full object-contain" />;
  }
  return <span className="text-9xl">{src || '✨'}</span>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const { getProductById } = useProducts();
  const { addItem, items } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const stored = getProductById(id);

  const product = stored
    ? {
        id: stored.id,
        name: stored.name,
        price: stored.price,
        originalPrice: stored.originalPrice,
        description: stored.description || '',
        category: stored.category,
        brand: stored.brand,
        inStock: stored.status === 'active' && stored.stock > 0,
        stock: stored.stock,
        rating: stored.rating,
        reviews: stored.reviews,
        image: stored.image,
      }
    : {
        id,
        name: 'Premium Face Serum',
        price: 29.99,
        originalPrice: 49.99,
        description:
          'Nourish your skin with this toxin-free premium face serum. Formulated with natural ingredients to provide deep hydration and anti-aging benefits.',
        category: 'Skin care',
        brand: 'Minsah Beauty',
        inStock: true,
        stock: 10,
        rating: 4.5,
        reviews: 128,
        image: '💄',
      };

  const cartQty = items.find(i => i.id === product.id)?.quantity ?? 0;

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      sku: product.id,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));
  const increaseQty = () => setQuantity(q => Math.min(product.stock, q + 1));

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />
      <Navbar />
      <main className="flex-grow py-6 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-pink-600">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/shop" className="text-gray-500 hover:text-pink-600">Shop</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium line-clamp-1">{product.name}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Product Image */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 flex items-center justify-center min-h-[320px] md:min-h-[480px]">
                <div className="w-full max-w-xs flex items-center justify-center aspect-square">
                  <ProductImage src={product.image} alt={product.name} />
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 md:p-8 flex flex-col">
                {/* Category & Brand */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-medium">{product.category}</span>
                  {product.brand && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{product.brand}</span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{product.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-pink-600">
                      {formatPrice(convertUSDtoBDT(product.price))}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span className="text-xl text-gray-400 line-through">
                          {formatPrice(convertUSDtoBDT(product.originalPrice))}
                        </span>
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-sm font-bold">
                          {discountPct}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <p className="text-green-600 text-sm mt-1 font-medium">
                      You save {formatPrice(convertUSDtoBDT(product.originalPrice - product.price))}!
                    </p>
                  )}
                </div>

                <p className="text-gray-600 mb-5 leading-relaxed text-sm">{product.description}</p>

                {/* Availability */}
                <div className="flex items-center gap-2 mb-5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                  </span>
                </div>

                {/* Quantity Selector */}
                {product.inStock && (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={decreaseQty}
                        disabled={quantity <= 1}
                        className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition disabled:opacity-40"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-xl font-bold w-10 text-center">{quantity}</span>
                      <button
                        onClick={increaseQty}
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition disabled:opacity-40"
                      >
                        <Plus size={16} />
                      </button>
                      {cartQty > 0 && (
                        <span className="text-xs text-gray-500 ml-1">{cartQty} already in cart</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock || addedToCart}
                    className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-base transition flex items-center justify-center gap-2 ${
                      !product.inStock
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : addedToCart
                        ? 'bg-green-500 text-white'
                        : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95'
                    }`}
                  >
                    {!product.inStock ? (
                      'Out of Stock'
                    ) : addedToCart ? (
                      <>✓ Added to Cart</>
                    ) : (
                      <><ShoppingCart size={20} /> Add to Cart</>
                    )}
                  </button>
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`px-4 py-3.5 border-2 rounded-xl transition ${
                      isWishlisted ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-400 hover:bg-red-50'
                    }`}
                    aria-label="Toggle wishlist"
                  >
                    <Heart size={20} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-500'} />
                  </button>
                </div>

                {/* View Cart shortcut */}
                {cartQty > 0 && (
                  <Link
                    href="/cart"
                    className="mt-3 text-center text-pink-600 hover:text-pink-700 text-sm font-medium underline underline-offset-2"
                  >
                    View Cart ({cartQty} item{cartQty !== 1 ? 's' : ''}) →
                  </Link>
                )}

                {/* Meta */}
                <div className="mt-5 pt-5 border-t border-gray-100 text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium text-gray-700">SKU:</span> {product.id}</p>
                  <p><span className="font-medium text-gray-700">Category:</span> {product.category}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/shop" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium text-sm">
              <ArrowLeft size={16} /> Back to Shop
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
