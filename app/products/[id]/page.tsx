'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Navbar from '../../components/Header';
import TopBar from '../../components/TopBar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { ShoppingCart, Heart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCcw, Sparkles } from 'lucide-react';
import { formatPrice } from '@/utils/currency';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';

// Dummy Color Swatches for the UI (Can be fetched from DB later)
const COLOR_SWATCHES = [
  { id: '88.0', hex: '#D7C4B1', name: 'Intense Light Blonde' },
  { id: '3.22', hex: '#8B7355', name: 'Ash Blonde' },
  { id: '8.3', hex: '#B8860B', name: 'Medium Gold' },
  { id: '5.4', hex: '#5C4033', name: 'Chestnut Brown' },
  { id: '22.0', hex: '#1A1A1A', name: 'Natural Black' },
];

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const isUrl = src && (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:'));
  if (isUrl) {
    return <img src={src} alt={alt} className="w-full h-full object-cover rounded-2xl" />;
  }
  return <div className="text-9xl flex items-center justify-center w-full h-full bg-gradient-to-br from-[#F5EFE6] to-[#EAE0D5] rounded-2xl">{src || '✨'}</div>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const { getProductById } = useProducts();
  const { addItem, items } = useCart();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // New States for Premium UI
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'two-mix' | 'three-mix'>('two-mix');
  const [selectedColors, setSelectedColors] = useState<string[]>(['88.0', '3.22']);

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
        name: 'TOV CH Permanent Hair Color Cream - Bangladesh\'s #1',
        price: 399,
        originalPrice: 450,
        description: 'Professional salon-quality color at home. Intensive Color Cream-Oil Technology with 100% grey coverage and long-lasting shine.',
        category: 'Hair Care',
        brand: 'TOV CH',
        inStock: true,
        stock: 50,
        rating: 4.9,
        reviews: 1234,
        image: '💇‍♀️',
      };

  // Pricing Logic based on selection
  const currentPrice = selectedPackage === 'single' ? 399 : selectedPackage === 'two-mix' ? 449 : 599;
  const packageQty = selectedPackage === 'single' ? 1 : selectedPackage === 'two-mix' ? 2 : 3;

  const handleToggleColor = (colorId: string) => {
    if (selectedColors.includes(colorId)) {
      setSelectedColors(selectedColors.filter(c => c !== colorId));
    } else {
      if (selectedColors.length < packageQty) {
        setSelectedColors([...selectedColors, colorId]);
      } else {
        // Replace last selected if max reached
        const newColors = [...selectedColors];
        newColors[newColors.length - 1] = colorId;
        setSelectedColors(newColors);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addItem({
      id: product.id,
      name: `${product.name} (${selectedPackage})`,
      price: currentPrice,
      quantity: 1,
      image: product.image,
      sku: `${product.id}-${selectedPackage}`,
      // You can pass selectedColors to your cart state if supported
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <TopBar />
      <Navbar />
      
      {/* Added pb-28 to account for sticky bottom bar on mobile */}
      <main className="flex-grow py-6 md:py-10 pb-28 md:pb-10">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#D4AF37] transition">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/shop" className="text-gray-500 hover:text-[#D4AF37] transition">Hair Care</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-medium line-clamp-1">{product.name}</span>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-[#F0EBE1]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              
              {/* Product Visuals (Left) */}
              <div className="p-4 md:p-8">
                <div className="relative w-full aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden shadow-inner bg-[#FDFBF7]">
                  <ProductImage src={product.image} alt={product.name} />
                  {/* Premium Badge */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-[#F0EBE1] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-gray-800">Salon Fashion</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="flex flex-col items-center justify-center text-center p-3 bg-[#FAF8F5] rounded-xl">
                    <ShieldCheck size={20} className="text-[#8B5E34] mb-1" />
                    <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">100% Original</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center p-3 bg-[#FAF8F5] rounded-xl">
                    <Truck size={20} className="text-[#8B5E34] mb-1" />
                    <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Fast Delivery</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center p-3 bg-[#FAF8F5] rounded-xl">
                    <RefreshCcw size={20} className="text-[#8B5E34] mb-1" />
                    <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">7 Days Return</span>
                  </div>
                </div>
              </div>

              {/* Product Details (Right) */}
              <div className="p-6 md:p-8 lg:p-10 flex flex-col border-l border-[#F0EBE1]/50 bg-white">
                
                {/* Title & Rating */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-gray-900 leading-tight mb-3">
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex text-[#D4AF37] gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18} className={i < Math.round(product.rating) ? 'fill-[#D4AF37]' : 'text-gray-200'} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-800">{product.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500 underline decoration-gray-200 underline-offset-4">({product.reviews} reviews)</span>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-8 leading-relaxed text-sm md:text-base">
                  {product.description}
                </p>

                {/* Smart Pricing Cards */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Choose Package</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Single */}
                    <button 
                      onClick={() => { setSelectedPackage('single'); setSelectedColors(['88.0']); }}
                      className={`relative p-4 rounded-2xl border-2 transition-all text-left ${selectedPackage === 'single' ? 'border-[#D4AF37] bg-[#FAF8F5]' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="text-sm text-gray-500 mb-1">Basic</div>
                      <div className="font-bold text-gray-900">Single Color</div>
                      <div className="text-lg font-serif text-[#8B5E34] mt-2">৳399</div>
                    </button>

                    {/* Two Mix (Highlighted) */}
                    <button 
                      onClick={() => { setSelectedPackage('two-mix'); setSelectedColors(['88.0', '3.22']); }}
                      className={`relative p-4 rounded-2xl border-2 transition-all text-left ${selectedPackage === 'two-mix' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                        🔥 BEST VALUE
                      </div>
                      <div className="text-sm text-[#8B5E34] font-medium mb-1">Most Popular</div>
                      <div className="font-bold text-gray-900">Two Color Mix</div>
                      <div className="text-lg font-serif text-[#8B5E34] mt-2">৳449</div>
                    </button>

                    {/* Three Mix */}
                    <button 
                      onClick={() => { setSelectedPackage('three-mix'); setSelectedColors(['88.0', '3.22', '8.3']); }}
                      className={`relative p-4 rounded-2xl border-2 transition-all text-left ${selectedPackage === 'three-mix' ? 'border-[#D4AF37] bg-[#FAF8F5]' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="text-sm text-gray-500 mb-1">Premium</div>
                      <div className="font-bold text-gray-900">Three Color Mix</div>
                      <div className="text-lg font-serif text-[#8B5E34] mt-2">৳599</div>
                    </button>
                  </div>
                </div>

                {/* Interactive Color Palette */}
                <div className="mb-8 p-5 bg-[#FAF8F5] rounded-2xl border border-[#F0EBE1]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Shades ({selectedColors.length}/{packageQty})</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.id}
                        onClick={() => handleToggleColor(swatch.id)}
                        className={`group relative w-12 h-12 rounded-full transition-all duration-300 ${selectedColors.includes(swatch.id) ? 'ring-2 ring-offset-2 ring-[#8B5E34] scale-110' : 'hover:scale-105 border border-gray-200'}`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      >
                        {selectedColors.includes(swatch.id) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {selectedColors.length < packageQty 
                      ? `Select ${packageQty - selectedColors.length} more color(s)` 
                      : 'Perfect combination selected!'}
                  </p>
                </div>

                {/* The Art of Mixing (Visual) */}
                {selectedPackage !== 'single' && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">The Art of Mixing</h3>
                    <div className="flex items-center justify-center gap-4 bg-white p-6 rounded-2xl border border-[#F0EBE1] shadow-sm">
                      <div className="flex -space-x-3">
                        {selectedColors.map((colorId, idx) => {
                          const bg = COLOR_SWATCHES.find(c => c.id === colorId)?.hex;
                          return (
                            <div key={idx} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: bg }}></div>
                          );
                        })}
                      </div>
                      <div className="text-gray-400 font-bold">=</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#8B5E34]">Unique Custom Shade</span>
                        <span className="text-xs text-gray-500">Professional results at home</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar (Mobile & Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="container mx-auto max-w-6xl flex items-center justify-between gap-4">
          
          <div className="hidden md:flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Price</span>
            <span className="text-2xl font-serif text-[#8B5E34] font-bold">{formatPrice(currentPrice)}</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-1 md:flex-none">
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`p-3.5 border rounded-xl transition-colors ${
                isWishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 bg-white'
              }`}
            >
              <Heart size={24} className={isWishlisted ? 'fill-current' : ''} />
            </button>
            
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || addedToCart || selectedColors.length !== packageQty}
              className={`flex-1 md:px-12 py-3.5 rounded-xl font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                !product.inStock || selectedColors.length !== packageQty
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : addedToCart
                  ? 'bg-green-600'
                  : 'bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:shadow-lg hover:-translate-y-0.5' // WhatsApp Green Vibe for Express Checkout
              }`}
            >
              {addedToCart ? (
                <>✓ Added to Cart</>
              ) : (
                <>Order Now (৳{currentPrice})</>
              )}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

//design from gemini

// 'use client';

// import { useParams } from 'next/navigation';
// import { useState } from 'react';
// import Navbar from '../../components/Header';
// import TopBar from '../../components/TopBar';
// import Footer from '../../components/Footer';
// import Link from 'next/link';
// import { ShoppingCart, Heart, Minus, Plus, ArrowLeft, Star } from 'lucide-react';
// import { formatPrice } from '@/utils/currency';
// import { useProducts } from '@/contexts/ProductsContext';
// import { useCart } from '@/contexts/CartContext';

// function ProductImage({ src, alt }: { src: string; alt: string }) {
//   const isUrl = src && (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:'));
//   if (isUrl) {
//     return <img src={src} alt={alt} className="w-full h-full object-contain" />;
//   }
//   return <span className="text-9xl">{src || '✨'}</span>;
// }

// export default function ProductDetailPage() {
//   const params = useParams();
//   const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
//   const { getProductById } = useProducts();
//   const { addItem, items } = useCart();

//   const [quantity, setQuantity] = useState(1);
//   const [isWishlisted, setIsWishlisted] = useState(false);
//   const [addedToCart, setAddedToCart] = useState(false);

//   const stored = getProductById(id);

//   const product = stored
//     ? {
//         id: stored.id,
//         name: stored.name,
//         price: stored.price,
//         originalPrice: stored.originalPrice,
//         description: stored.description || '',
//         category: stored.category,
//         brand: stored.brand,
//         inStock: stored.status === 'active' && stored.stock > 0,
//         stock: stored.stock,
//         rating: stored.rating,
//         reviews: stored.reviews,
//         image: stored.image,
//       }
//     : {
//         id,
//         name: 'Premium Face Serum',
//         price: 29.99,
//         originalPrice: 49.99,
//         description:
//           'Nourish your skin with this toxin-free premium face serum. Formulated with natural ingredients to provide deep hydration and anti-aging benefits.',
//         category: 'Skin care',
//         brand: 'Minsah Beauty',
//         inStock: true,
//         stock: 10,
//         rating: 4.5,
//         reviews: 128,
//         image: '💄',
//       };

//   const cartQty = items.find(i => i.id === product.id)?.quantity ?? 0;

//   const handleAddToCart = () => {
//     if (!product.inStock) return;
//     addItem({
//       id: product.id,
//       name: product.name,
//       price: product.price,
//       quantity,
//       image: product.image,
//       sku: product.id,
//     });
//     setAddedToCart(true);
//     setTimeout(() => setAddedToCart(false), 2000);
//   };

//   const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));
//   const increaseQty = () => setQuantity(q => Math.min(product.stock, q + 1));

//   const discountPct =
//     product.originalPrice && product.originalPrice > product.price
//       ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
//       : null;

//   return (
//     <div className="min-h-screen flex flex-col bg-gray-50">
//       <TopBar />
//       <Navbar />
//       <main className="flex-grow py-6 md:py-12">
//         <div className="container mx-auto px-4 max-w-5xl">
//           {/* Breadcrumb */}
//           <div className="mb-6 flex items-center gap-2 text-sm">
//             <Link href="/" className="text-gray-500 hover:text-pink-600">Home</Link>
//             <span className="text-gray-400">/</span>
//             <Link href="/shop" className="text-gray-500 hover:text-pink-600">Shop</Link>
//             <span className="text-gray-400">/</span>
//             <span className="text-gray-700 font-medium line-clamp-1">{product.name}</span>
//           </div>

//           <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
//               {/* Product Image */}
//               <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 flex items-center justify-center min-h-[320px] md:min-h-[480px]">
//                 <div className="w-full max-w-xs flex items-center justify-center aspect-square">
//                   <ProductImage src={product.image} alt={product.name} />
//                 </div>
//               </div>

//               {/* Product Info */}
//               <div className="p-6 md:p-8 flex flex-col">
//                 {/* Category & Brand */}
//                 <div className="flex items-center gap-2 mb-3 flex-wrap">
//                   <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-medium">{product.category}</span>
//                   {product.brand && (
//                     <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{product.brand}</span>
//                   )}
//                 </div>

//                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

//                 {/* Rating */}
//                 <div className="flex items-center gap-2 mb-4">
//                   <div className="flex text-yellow-400 gap-0.5">
//                     {Array.from({ length: 5 }).map((_, i) => (
//                       <Star
//                         key={i}
//                         size={16}
//                         className={i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
//                       />
//                     ))}
//                   </div>
//                   <span className="text-sm font-medium text-gray-700">{product.rating.toFixed(1)}</span>
//                   <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
//                 </div>

//                 {/* Price */}
//                 <div className="mb-5">
//                   <div className="flex items-center gap-3 flex-wrap">
//                     <span className="text-3xl font-bold text-pink-600">
//                       {formatPrice(product.price)}
//                     </span>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <>
//                         <span className="text-xl text-gray-400 line-through">
//                           {formatPrice(product.originalPrice)}
//                         </span>
//                         <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-sm font-bold">
//                           {discountPct}% OFF
//                         </span>
//                       </>
//                     )}
//                   </div>
//                   {product.originalPrice && product.originalPrice > product.price && (
//                     <p className="text-green-600 text-sm mt-1 font-medium">
//                       You save {formatPrice(product.originalPrice - product.price)}!
//                     </p>
//                   )}
//                 </div>

//                 <p className="text-gray-600 mb-5 leading-relaxed text-sm">{product.description}</p>

//                 {/* Availability */}
//                 <div className="flex items-center gap-2 mb-5">
//                   <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
//                   <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
//                     {product.inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
//                   </span>
//                 </div>

//                 {/* Quantity Selector */}
//                 {product.inStock && (
//                   <div className="mb-5">
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
//                     <div className="flex items-center gap-3">
//                       <button
//                         onClick={decreaseQty}
//                         disabled={quantity <= 1}
//                         className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition disabled:opacity-40"
//                       >
//                         <Minus size={16} />
//                       </button>
//                       <span className="text-xl font-bold w-10 text-center">{quantity}</span>
//                       <button
//                         onClick={increaseQty}
//                         disabled={quantity >= product.stock}
//                         className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-pink-400 hover:bg-pink-50 transition disabled:opacity-40"
//                       >
//                         <Plus size={16} />
//                       </button>
//                       {cartQty > 0 && (
//                         <span className="text-xs text-gray-500 ml-1">{cartQty} already in cart</span>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Action Buttons */}
//                 <div className="flex gap-3">
//                   <button
//                     onClick={handleAddToCart}
//                     disabled={!product.inStock || addedToCart}
//                     className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-base transition flex items-center justify-center gap-2 ${
//                       !product.inStock
//                         ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                         : addedToCart
//                         ? 'bg-green-500 text-white'
//                         : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95'
//                     }`}
//                   >
//                     {!product.inStock ? (
//                       'Out of Stock'
//                     ) : addedToCart ? (
//                       <>✓ Added to Cart</>
//                     ) : (
//                       <><ShoppingCart size={20} /> Add to Cart</>
//                     )}
//                   </button>
//                   <button
//                     onClick={() => setIsWishlisted(!isWishlisted)}
//                     className={`px-4 py-3.5 border-2 rounded-xl transition ${
//                       isWishlisted ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-400 hover:bg-red-50'
//                     }`}
//                     aria-label="Toggle wishlist"
//                   >
//                     <Heart size={20} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-500'} />
//                   </button>
//                 </div>

//                 {/* View Cart shortcut */}
//                 {cartQty > 0 && (
//                   <Link
//                     href="/cart"
//                     className="mt-3 text-center text-pink-600 hover:text-pink-700 text-sm font-medium underline underline-offset-2"
//                   >
//                     View Cart ({cartQty} item{cartQty !== 1 ? 's' : ''}) →
//                   </Link>
//                 )}

//                 {/* Meta */}
//                 <div className="mt-5 pt-5 border-t border-gray-100 text-sm text-gray-500 space-y-1">
//                   <p><span className="font-medium text-gray-700">SKU:</span> {product.id}</p>
//                   <p><span className="font-medium text-gray-700">Category:</span> {product.category}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="mt-6">
//             <Link href="/shop" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium text-sm">
//               <ArrowLeft size={16} /> Back to Shop
//             </Link>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// }
