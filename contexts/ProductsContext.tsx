'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  item?: string;
  brand: string;
  originCountry: string;
  price: number;
  originalPrice?: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  createdAt: string;
  featured: boolean;
  description?: string;
  weight?: string;
  ingredients?: string;
  skinType?: string[];
  expiryDate?: string;
  shelfLife?: string;
  variants?: Array<{
    id: string;
    size?: string;
    color?: string;
    price: string;
    stock: string;
    sku: string;
  }>;
  metaTitle?: string;
  metaDescription?: string;
  urlSlug?: string;
  tags?: string;
  shippingWeight?: string;
  dimensions?: { length: string; width: string; height: string };
  isFragile?: boolean;
  freeShippingEligible?: boolean;
  discountPercentage?: string;
  salePrice?: string;
  offerStartDate?: string;
  offerEndDate?: string;
  flashSaleEligible?: boolean;
  lowStockThreshold?: string;
  barcode?: string;
  returnEligible?: boolean;
  codAvailable?: boolean;
  preOrderOption?: boolean;
  relatedProducts?: string;
}

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  saveProducts: (newProducts: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch ALL products from Elasticsearch (match_all, no query = promotional boosting)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // No "q" → ES runs match_all + isFeatured/isFlashSale boosting
      const res = await fetch('/api/search?limit=500&sort=featured');
      if (!res.ok) throw new Error('Elasticsearch fetch failed');
      const data = await res.json();

      // Map Elasticsearch product shape → ProductsContext Product shape
      const mapped: Product[] = (data.products || []).map((p: {
        id: string;
        name: string;
        slug?: string;
        category?: string;
        subcategory?: string;
        brand?: string;
        price: number;
        compareAtPrice?: number;
        images?: string[];
        inStock?: boolean;
        rating?: number;
        description?: string;
        tags?: string[];
        isFeatured?: boolean;
        isFlashSale?: boolean;
        isNewArrival?: boolean;
        createdAt?: string;
      }) => ({
        id: p.id,
        name: p.name,
        category: p.category ?? 'Uncategorized',
        subcategory: p.subcategory,
        brand: p.brand ?? 'Minsah Beauty',
        originCountry: 'Bangladesh (Local)',
        price: p.price,
        originalPrice: p.compareAtPrice ?? undefined,
        stock: p.inStock ? 1 : 0,
        status: (p.inStock === false ? 'out_of_stock' : 'active') as 'active' | 'inactive' | 'out_of_stock',
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '✨',
        images: p.images,
        rating: p.rating ?? 0,
        reviews: 0,
        createdAt: p.createdAt ?? new Date().toISOString(),
        featured: p.isFeatured ?? false,
        description: p.description,
        tags: Array.isArray(p.tags) ? p.tags.join(',') : undefined,
        urlSlug: p.slug,
      }));

      setProducts(mapped);
    } catch (error) {
      console.error('Error fetching products from Elasticsearch:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (id: string, updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        setProducts,
        saveProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        refreshProducts: fetchProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
