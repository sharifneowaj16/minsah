'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth, PERMISSIONS } from '@/contexts/AdminAuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCategories } from '@/contexts/CategoriesContext';
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Package,
  Tag,
  Search,
  TruckIcon,
  Percent,
  AlertCircle,
  Settings,
  Loader2,
} from 'lucide-react';

interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  price: string;
  stock: string;
  sku: string;
}

interface ProductImage {
  id: string;
  file?: File;
  preview: string;
  isMain: boolean;
  existingUrl?: string;
}

interface ProductFormData {
  name: string;
  category: string;
  subcategory: string;
  item: string;
  brand: string;
  originCountry: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  description: string;
  weight: string;
  ingredients: string;
  skinType: string[];
  expiryDate: string;
  shelfLife: string;
  productCondition: 'NEW' | 'USED' | 'REFURBISHED';
  gtin: string;
  averageRating: number;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  tags: string;
  bengaliProductName: string;
  bengaliMetaDescription: string;
  focusKeyword: string;
  ogTitle: string;
  ogImageFile: File | null;
  ogImagePreview: string;
  imageAltTexts: string[];
  shippingWeight: string;
  dimensions: { length: string; width: string; height: string };
  isFragile: boolean;
  freeShippingEligible: boolean;
  discountPercentage: string;
  salePrice: string;
  offerStartDate: string;
  offerEndDate: string;
  flashSaleEligible: boolean;
  lowStockThreshold: string;
  barcode: string;
  returnEligible: boolean;
  codAvailable: boolean;
  preOrderOption: boolean;
  relatedProducts: string;
}

const countries = [
  'Bangladesh (Local)', 'USA', 'France', 'UK', 'Japan',
  'South Korea', 'Germany', 'Italy', 'Thailand', 'India', 'China',
];

const skinTypes = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'All Skin Types'];

const defaultFormData: ProductFormData = {
  name: '', category: '', subcategory: '', item: '', brand: '',
  originCountry: 'Bangladesh (Local)', status: 'active', featured: false,
  description: '', weight: '', ingredients: '', skinType: [], expiryDate: '',
  shelfLife: '', productCondition: 'NEW', gtin: '', averageRating: 0, reviewCount: 0,
  images: [],
  variants: [{ id: '1', size: '', color: '', price: '', stock: '', sku: '' }],
  metaTitle: '', metaDescription: '', urlSlug: '', tags: '',
  bengaliProductName: '', bengaliMetaDescription: '', focusKeyword: '',
  ogTitle: '', ogImageFile: null, ogImagePreview: '', imageAltTexts: [],
  shippingWeight: '', dimensions: { length: '', width: '', height: '' },
  isFragile: false, freeShippingEligible: true, discountPercentage: '',
  salePrice: '', offerStartDate: '', offerEndDate: '', flashSaleEligible: false,
  lowStockThreshold: '10', barcode: '', returnEligible: true,
  codAvailable: true, preOrderOption: false, relatedProducts: '',
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { hasPermission } = useAdminAuth();
  const { refreshProducts } = useProducts();
  const { getActiveCategories } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoriesData = useMemo(() => {
    return getActiveCategories().map(cat => ({
      name: cat.name,
      subcategories: cat.subcategories,
    }));
  }, [getActiveCategories]);

  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── Fetch existing product ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/admin/products/${productId}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        const p = data.product;

        // Admin API returns images as full objects with {id, url, alt, isDefault}
        const existingImages: ProductImage[] = (p.images || []).map(
          (img: { id: string; url: string; alt?: string; isDefault?: boolean }, i: number) => ({
            id: img.id || 'existing-' + i,
            preview: img.url,
            isMain: img.isDefault || i === 0,
            existingUrl: img.url,
            _alt: img.alt || '',
          } as ProductImage & { _alt: string })
        );

        // Admin API returns variants with {id, sku, name, price, stock, quantity, attributes}
        const existingVariants: ProductVariant[] =
          p.variants && p.variants.length > 0
            ? p.variants.map((v: {
                id: string;
                sku?: string;
                name?: string;
                price?: number | null;
                quantity?: number;
                stock?: number;
                attributes?: { size?: string; color?: string; [key: string]: string | undefined } | null;
              }) => ({
                id: v.id,
                size: v.attributes?.size || '',
                color: v.attributes?.color || '',
                price: String(v.price ?? p.price ?? ''),
                stock: String(v.stock ?? v.quantity ?? 0),
                sku: v.sku || '',
              }))
            : [{ id: '1', size: '', color: '', price: String(p.price || ''), stock: String(p.stock ?? 0), sku: '' }];

        setFormData({
          ...defaultFormData,
          // ── Basic ─────────────────────────────────────────────────────
          name: p.name || '',
          category: p.category || '',
          brand: p.brand || '',
          originCountry: p.originCountry || 'Bangladesh (Local)',
          status: p.status || (p.isActive ? 'active' : 'inactive'),
          featured: p.featured || p.isFeatured || false,
          description: p.description || '',
          // ── Images ────────────────────────────────────────────────────
          images: existingImages,
          imageAltTexts: existingImages.map((img: ProductImage & { _alt?: string }) => img._alt || ''),
          // ── Variants ──────────────────────────────────────────────────
          variants: existingVariants,
          // ── Specs ─────────────────────────────────────────────────────
          weight: p.weight != null ? String(p.weight) : '',
          ingredients: p.ingredients || '',
          skinType: Array.isArray(p.skinType) ? p.skinType : [],
          expiryDate: p.expiryDate ? String(p.expiryDate).split('T')[0] : '',
          shelfLife: p.shelfLife || '',
          productCondition: p.condition || 'NEW',
          gtin: p.gtin || '',
          averageRating: p.averageRating || 0,
          reviewCount: p.reviewCount || 0,
          // ── SEO ───────────────────────────────────────────────────────
          metaTitle: p.metaTitle || '',
          metaDescription: p.metaDescription || '',
          urlSlug: p.slug || '',
          tags: p.tags || '',
          bengaliProductName: p.bengaliName || '',
          bengaliMetaDescription: p.bengaliDescription || '',
          focusKeyword: p.focusKeyword || '',
          ogTitle: p.ogTitle || '',
          ogImagePreview: p.ogImageUrl || '',
          // ── Shipping ──────────────────────────────────────────────────
          shippingWeight: p.shippingWeight || '',
          dimensions: p.dimensions || { length: '', width: '', height: '' },
          isFragile: p.isFragile || false,
          freeShippingEligible: p.freeShippingEligible !== false,
          // ── Discount ──────────────────────────────────────────────────
          discountPercentage: p.discountPercentage != null ? String(p.discountPercentage) : '',
          salePrice: p.salePrice != null ? String(p.salePrice) : '',
          offerStartDate: p.offerStartDate || '',
          offerEndDate: p.offerEndDate || '',
          flashSaleEligible: p.flashSaleEligible || false,
          // ── Stock ─────────────────────────────────────────────────────
          lowStockThreshold: p.lowStockThreshold != null ? String(p.lowStockThreshold) : '10',
          barcode: p.barcode || '',
          // ── Options ───────────────────────────────────────────────────
          returnEligible: p.returnEligible !== false,
          codAvailable: p.codAvailable !== false,
          preOrderOption: p.preOrderOption || false,
          relatedProducts: p.relatedProducts || '',
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleDimensionChange = (field: 'length' | 'width' | 'height', value: string) => {
    setFormData(prev => ({ ...prev, dimensions: { ...prev.dimensions, [field]: value } }));
  };

  const handleSkinTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      skinType: prev.skinType.includes(type)
        ? prev.skinType.filter(t => t !== type)
        : [...prev.skinType, type],
    }));
  };

  // Images
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImages: ProductImage[] = Array.from(files)
      .filter(file => {
        if (!file.type.startsWith('image/')) { alert(`${file.name} is not an image`); return false; }
        if (file.size > 10 * 1024 * 1024) { alert(`${file.name} exceeds 10MB`); return false; }
        return true;
      })
      .map((file, idx) => ({
        id: `${Date.now()}_${idx}_${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        isMain: formData.images.length === 0 && idx === 0,
      }));
    if (newImages.length === 0) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages],
      imageAltTexts: [...prev.imageAltTexts, ...newImages.map(() => '')],
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (imageId: string) => {
    setFormData(prev => {
      const index = prev.images.findIndex(img => img.id === imageId);
      const removed = prev.images[index];
      if (removed?.file) URL.revokeObjectURL(removed.preview);
      const newImages = prev.images.filter(img => img.id !== imageId);
      const newAltTexts = prev.imageAltTexts.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isMain)) newImages[0].isMain = true;
      return { ...prev, images: newImages, imageAltTexts: newAltTexts };
    });
  };

  const handleSetMainImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img => ({ ...img, isMain: img.id === imageId })),
    }));
  };

  const handleImageAltTextChange = (index: number, value: string) => {
    setFormData(prev => {
      const newAltTexts = [...prev.imageAltTexts];
      newAltTexts[index] = value;
      return { ...prev, imageAltTexts: newAltTexts };
    });
  };

  const handleOgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('OG Image must be under 5MB'); return; }
    const preview = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, ogImageFile: file, ogImagePreview: preview }));
  };

  // Variants
  const handleVariantChange = (variantId: string, field: keyof ProductVariant, value: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === variantId ? { ...v, [field]: value } : v),
    }));
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { id: Date.now().toString(), size: '', color: '', price: '', stock: '', sku: `SKU-${Date.now()}` }],
    }));
  };

  const handleRemoveVariant = (variantId: string) => {
    if (formData.variants.length <= 1) { alert('At least one variant is required'); return; }
    setFormData(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== variantId) }));
  };

  const calculateSalePrice = (price: string, discount: string) => {
    const p = parseFloat(price), d = parseFloat(discount);
    if (isNaN(p) || isNaN(d)) return '';
    return (p - (p * d / 100)).toFixed(2);
  };

  const handleDiscountChange = (discount: string) => {
    setFormData(prev => ({
      ...prev,
      discountPercentage: discount,
      salePrice: calculateSalePrice(prev.variants[0]?.price || '', discount),
    }));
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload new images; keep existing ones
      const uploadedImages: Array<{ url: string; altText: string }> = [];
      for (let i = 0; i < formData.images.length; i++) {
        const img = formData.images[i];
        if (img.file) {
          const uploadForm = new FormData();
          uploadForm.append('file', img.file);
          uploadForm.append('folder', `products/${productId}`);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
          if (!uploadRes.ok) throw new Error('Image upload failed');
          const uploadData = await uploadRes.json();
          uploadedImages.push({ url: uploadData.url, altText: formData.imageAltTexts[i] || '' });
        } else if (img.existingUrl) {
          uploadedImages.push({ url: img.existingUrl, altText: formData.imageAltTexts[i] || '' });
        }
      }

      // Put main image first
      const mainIndex = formData.images.findIndex(img => img.isMain);
      if (mainIndex > 0) {
        const [main] = uploadedImages.splice(mainIndex, 1);
        uploadedImages.unshift(main);
      }

      // Upload OG image if new
      let uploadedOgImageUrl: string | undefined = formData.ogImagePreview || undefined;
      if (formData.ogImageFile) {
        const ogForm = new FormData();
        ogForm.append('file', formData.ogImageFile);
        ogForm.append('folder', 'products/og-images');
        const ogRes = await fetch('/api/upload', { method: 'POST', body: ogForm });
        if (ogRes.ok) {
          const ogData = await ogRes.json();
          uploadedOgImageUrl = ogData.url;
        }
      }

      const basePrice = parseFloat(formData.variants[0]?.price || '0') || 0;
      const originalPrice = formData.discountPercentage
        ? basePrice / (1 - parseFloat(formData.discountPercentage) / 100)
        : formData.salePrice ? parseFloat(formData.salePrice) : undefined;
      const totalStock = formData.variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

      const payload = {
        name: formData.name,
        description: formData.description,
        price: basePrice,
        originalPrice,
        stock: totalStock,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        brand: formData.brand,
        originCountry: formData.originCountry,
        status: formData.status,
        featured: formData.featured,
        images: uploadedImages.map((img, idx) => ({
          url: img.url,
          alt: img.altText || formData.name,
          title: img.altText || formData.name,
          sortOrder: idx,
        })),
        variants: formData.variants.map(v => ({
          size: v.size,
          color: v.color,
          price: parseFloat(v.price) || basePrice,
          stock: parseInt(v.stock) || 0,
          sku: v.sku,
          attributes: { size: v.size, color: v.color },
        })),
        // Specs
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        ingredients: formData.ingredients || undefined,
        skinType: formData.skinType.length > 0 ? formData.skinType : undefined,
        expiryDate: formData.expiryDate || undefined,
        shelfLife: formData.shelfLife || undefined,
        condition: formData.productCondition,
        gtin: formData.gtin || undefined,
        averageRating: formData.averageRating || 0,
        reviewCount: formData.reviewCount || 0,
        // SEO
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        slug: formData.urlSlug || undefined,
        tags: formData.tags || undefined,
        bengaliName: formData.bengaliProductName || undefined,
        bengaliDescription: formData.bengaliMetaDescription || undefined,
        focusKeyword: formData.focusKeyword || undefined,
        ogTitle: formData.ogTitle || formData.metaTitle || undefined,
        ogImageUrl: uploadedOgImageUrl || undefined,
        // Shipping
        shippingWeight: formData.shippingWeight || undefined,
        dimensions: (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height)
          ? formData.dimensions : undefined,
        isFragile: formData.isFragile || undefined,
        freeShippingEligible: formData.freeShippingEligible,
        // Discount
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : undefined,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        offerStartDate: formData.offerStartDate || undefined,
        offerEndDate: formData.offerEndDate || undefined,
        flashSaleEligible: formData.flashSaleEligible || undefined,
        // Stock
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : 10,
        barcode: formData.barcode || undefined,
        // Options
        returnEligible: formData.returnEligible,
        codAvailable: formData.codAvailable,
        preOrderOption: formData.preOrderOption || undefined,
        relatedProducts: formData.relatedProducts || undefined,
      };

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update product');
      }

      await refreshProducts();
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error instanceof Error ? error.message : 'Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Guards ────────────────────────────────────────────────────────────────
  if (!hasPermission(PERMISSIONS.PRODUCTS_EDIT)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">You don&apos;t have permission to edit products.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading product...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{loadError}</p>
          <Link href="/admin/products" className="mt-2 inline-block text-purple-600 hover:underline">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const selectedCategoryData = categoriesData.find(c => c.name === formData.category);
  const subcategories = selectedCategoryData?.subcategories || [];
  const selectedSubcategoryData = subcategories.find((s: { name: string }) => s.name === formData.subcategory);
  const items = (selectedSubcategoryData as { name: string; items?: string[] } | undefined)?.items || [];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 text-sm mt-1">ID: {productId}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── 1. Basic Information ──────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Package className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="space-y-4">

            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Hydrating Face Serum with Hyaluronic Acid" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Category / Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select name="category" value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '', item: '' }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">Select category</option>
                  {categoriesData.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                <select name="subcategory" value={formData.subcategory}
                  onChange={e => setFormData(prev => ({ ...prev, subcategory: e.target.value, item: '' }))}
                  disabled={!formData.category}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50">
                  <option value="">Select subcategory</option>
                  {subcategories.map((s: { name: string }) => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Item / Brand / Origin */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type/Item</label>
                <select name="item" value={formData.item} onChange={handleChange}
                  disabled={!formData.subcategory}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50">
                  <option value="">Select item</option>
                  {items.map((item: string) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.brand ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter brand name" />
                {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin Country *</label>
                <select name="originCountry" value={formData.originCountry} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Status / Featured */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center">
                  <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                  <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Provide a detailed description of the product, its benefits, how to use it, etc." />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>
        </div>

        {/* ── 2. Product Images ─────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-2">
            <ImageIcon className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Upload product images. Max 10MB per image. First/Main image is the display image.</p>

          <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/jpg,image/webp" className="hidden" onChange={handleImageUpload} />

          <div className="space-y-4">
            <div>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                <Upload className="w-5 h-5 mr-2" /> Upload Images
              </button>
              <p className="mt-2 text-xs text-gray-500">Supported: JPEG, PNG, WebP (Max 10MB each)</p>
              {errors.images && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />{errors.images}
                </div>
              )}
            </div>

            {formData.images.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Images ({formData.images.length}) — hover to set main or remove
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  {formData.images.map((image, index) => (
                    <div key={image.id}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all ${image.isMain ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'}`}>
                      <div className="aspect-square">
                        <img src={image.preview} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      {image.isMain && (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded shadow">Main</div>
                      )}
                      {image.existingUrl && !image.file && (
                        <div className="absolute top-2 right-2 bg-gray-800/70 text-white text-xs px-1 rounded">Saved</div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        {!image.isMain && (
                          <button type="button" onClick={() => handleSetMainImage(image.id)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 shadow-lg" title="Set as main">
                            <ImageIcon className="w-4 h-4 text-gray-700" />
                          </button>
                        )}
                        <button type="button" onClick={() => handleRemoveImage(image.id)}
                          className="p-2 bg-red-500 rounded-full hover:bg-red-600 shadow-lg" title="Remove">
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Image Alt Texts */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Image Alt Texts (for SEO)</h3>
                  <p className="text-xs text-gray-600 mb-4">Add descriptive alt text for each image to improve search engine visibility</p>
                  <div className="space-y-3">
                    {formData.images.map((image, index) => (
                      <div key={image.id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <img src={image.preview} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Image {index + 1} Alt Text {image.isMain && '(Main)'}
                          </label>
                          <input type="text" value={formData.imageAltTexts[index] || ''}
                            onChange={e => handleImageAltTextChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="e.g., TOV CH Hair Color Cream Bangladesh" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Product Variants ───────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Tag className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
                <p className="text-sm text-gray-600">Add different sizes, colors, or variations with individual pricing</p>
              </div>
            </div>
            <button type="button" onClick={handleAddVariant}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" /> Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Variant #{index + 1}</h3>
                  {formData.variants.length > 1 && (
                    <button type="button" onClick={() => handleRemoveVariant(variant.id)}
                      className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Size/Volume</label>
                    <input type="text" value={variant.size || ''} onChange={e => handleVariantChange(variant.id, 'size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" placeholder="e.g., 30ml" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color/Shade</label>
                    <input type="text" value={variant.color || ''} onChange={e => handleVariantChange(variant.id, 'color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" placeholder="e.g., Beige" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (BDT ৳) *</label>
                    <input type="number" value={variant.price} onChange={e => handleVariantChange(variant.id, 'price', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors[`variant_${variant.id}_price`] ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="0.00" step="0.01" min="0" />
                    {errors[`variant_${variant.id}_price`] && <p className="mt-1 text-xs text-red-600">{errors[`variant_${variant.id}_price`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock *</label>
                    <input type="number" value={variant.stock} onChange={e => handleVariantChange(variant.id, 'stock', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors[`variant_${variant.id}_stock`] ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="0" min="0" />
                    {errors[`variant_${variant.id}_stock`] && <p className="mt-1 text-xs text-red-600">{errors[`variant_${variant.id}_stock`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                    <input type="text" value={variant.sku} onChange={e => handleVariantChange(variant.id, 'sku', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm ${errors[`variant_${variant.id}_sku`] ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="SKU-001" />
                    {errors[`variant_${variant.id}_sku`] && <p className="mt-1 text-xs text-red-600">{errors[`variant_${variant.id}_sku`]}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. Product Specifications ─────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Product Specifications</h2>
          </div>
          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Net Weight/Volume</label>
                <input type="text" name="weight" value={formData.weight} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 50ml, 100g" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life</label>
                <input type="text" name="shelfLife" value={formData.shelfLife} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 24 months" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            {/* Skin Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Suitable for Skin Type *</label>
              <div className="flex flex-wrap gap-2">
                {skinTypes.map(type => (
                  <button key={type} type="button" onClick={() => handleSkinTypeToggle(type)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      formData.skinType.includes(type)
                        ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                    }`}>
                    {type}
                  </button>
                ))}
              </div>
              {errors.skinType && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />{errors.skinType}
                </p>
              )}
            </div>

            {/* Condition / GTIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Condition</label>
                <select name="productCondition" value={formData.productCondition} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                  <option value="REFURBISHED">Refurbished</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GTIN/EAN/UPC Barcode</label>
                <input type="text" name="gtin" value={formData.gtin} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="1234567890123" />
              </div>
            </div>

            {/* Rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Average Rating (0–5)</label>
                <input type="number" name="averageRating" value={formData.averageRating} onChange={handleChange}
                  min="0" max="5" step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                <p className="mt-1 text-xs text-gray-500">For structured data</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Count</label>
                <input type="number" name="reviewCount" value={formData.reviewCount} onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients List</label>
              <textarea name="ingredients" value={formData.ingredients} onChange={handleChange} rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Aqua, Glycerin, Hyaluronic Acid, Niacinamide, etc." />
            </div>
          </div>
        </div>

        {/* ── 5. SEO Settings ───────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Search className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">SEO Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} maxLength={60}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.metaTitle ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="SEO-optimized title for search engines" />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">Recommended: 50–60 characters</p>
                <p className="text-xs text-gray-500">{formData.metaTitle.length}/60</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} maxLength={160} rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.metaDescription ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Brief description for search engine results" />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">Recommended: 150–160 characters</p>
                <p className="text-xs text-gray-500">{formData.metaDescription.length}/160</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">বাংলা Product Name</label>
              <input type="text" name="bengaliProductName" value={formData.bengaliProductName} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="রোড পেপটাইড লিপ টিন্ট" />
              <p className="mt-1 text-xs text-gray-500">Bengali version for local SEO</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">বাংলা Meta Description</label>
              <textarea name="bengaliMetaDescription" value={formData.bengaliMetaDescription} onChange={handleChange} maxLength={160} rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="রোড পেপটাইড লিপ টিন্ট কিনুন সেরা দামে..." />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">০–১৬০ অক্ষর</p>
                <p className="text-xs text-gray-500">{formData.bengaliMetaDescription.length}/160</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keyword</label>
              <input type="text" name="focusKeyword" value={formData.focusKeyword} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="rhode lip tint bangladesh" />
              <p className="mt-1 text-xs text-gray-500">Main keyword you want to rank for</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook/WhatsApp Title (Open Graph)</label>
              <input type="text" name="ogTitle" value={formData.ogTitle} onChange={handleChange} maxLength={60}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Auto-filled from Meta Title" />
              <p className="mt-1 text-xs text-gray-500">Leave blank to use Meta Title</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Sharing Image (1200×630px recommended)</label>
              {formData.ogImagePreview && (
                <div className="mb-3">
                  <img src={formData.ogImagePreview} alt="OG Preview"
                    className="w-full max-w-md rounded-lg border border-gray-200" />
                  <p className="text-xs text-gray-500 mt-1">Current OG image — upload a new file to replace it</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleOgImageUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
              <p className="mt-1 text-xs text-gray-500">Appears when sharing on Facebook, WhatsApp, etc.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <input type="text" name="urlSlug" value={formData.urlSlug} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="product-url-slug" />
              <p className="mt-1 text-xs text-gray-500">URL: /products/{formData.urlSlug || 'product-url-slug'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags/Keywords</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="serum, hydrating, anti-aging (comma-separated)" />
            </div>
          </div>
        </div>

        {/* ── 6. Shipping & Delivery ────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <TruckIcon className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Shipping & Delivery</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Weight</label>
                <input type="text" name="shippingWeight" value={formData.shippingWeight} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 150g" />
                <p className="mt-1 text-xs text-gray-500">Weight with packaging</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Dimensions (L × W × H)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={formData.dimensions.length} onChange={e => handleDimensionChange('length', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" placeholder="L (cm)" />
                  <input type="text" value={formData.dimensions.width} onChange={e => handleDimensionChange('width', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" placeholder="W (cm)" />
                  <input type="text" value={formData.dimensions.height} onChange={e => handleDimensionChange('height', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" placeholder="H (cm)" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input type="checkbox" name="isFragile" checked={formData.isFragile} onChange={handleChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                <span className="ml-2 text-sm text-gray-700">Fragile Item (Handle with care)</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" name="freeShippingEligible" checked={formData.freeShippingEligible} onChange={handleChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                <span className="ml-2 text-sm text-gray-700">Eligible for Free Shipping</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── 7. Discount & Offers ──────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Percent className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Discount & Offers</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage</label>
                <input type="number" name="discountPercentage" value={formData.discountPercentage}
                  onChange={e => handleDiscountChange(e.target.value)}
                  min="0" max="100" step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (৳)</label>
                <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange}
                  step="0.01" min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00" />
                <p className="mt-1 text-xs text-gray-500">Auto-calculated from discount</p>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center">
                  <input type="checkbox" name="flashSaleEligible" checked={formData.flashSaleEligible} onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                  <span className="ml-2 text-sm text-gray-700">Flash Sale Eligible</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Start Date</label>
                <input type="datetime-local" name="offerStartDate" value={formData.offerStartDate} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer End Date</label>
                <input type="datetime-local" name="offerEndDate" value={formData.offerEndDate} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 8. Stock Management ───────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Stock Management</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Threshold</label>
              <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange}
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.lowStockThreshold ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="10" />
              <p className="mt-1 text-xs text-gray-500">Alert when stock falls below this number</p>
              {errors.lowStockThreshold && <p className="mt-1 text-sm text-red-600">{errors.lowStockThreshold}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode/UPC</label>
              <input type="text" name="barcode" value={formData.barcode} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter barcode number" />
            </div>
          </div>
        </div>

        {/* ── 9. Additional Options ─────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Additional Options</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'returnEligible', label: 'Return Eligible' },
                { name: 'codAvailable', label: 'Cash on Delivery' },
                { name: 'preOrderOption', label: 'Pre-order Option' },
              ].map(opt => (
                <label key={opt.name} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" name={opt.name}
                    checked={formData[opt.name as keyof ProductFormData] as boolean}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                  <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Products</label>
              <input type="text" name="relatedProducts" value={formData.relatedProducts} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter product IDs separated by commas (e.g., 101, 102, 103)" />
              <p className="mt-1 text-xs text-gray-500">IDs of related products to show on product page</p>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky bottom-0">
          <Link href="/admin/products"
            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium">
            <X className="w-5 h-5 mr-2" /> Cancel
          </Link>
          <button type="submit" disabled={isSubmitting}
            className="inline-flex items-center px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg">
            {isSubmitting
              ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
              : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
          </button>
        </div>

      </form>
    </div>
  );
}
