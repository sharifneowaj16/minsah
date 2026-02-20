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

const skinTypes = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'All Skin Types'];

const defaultFormData: ProductFormData = {
  name: '', category: '', subcategory: '', item: '', brand: '',
  originCountry: 'Bangladesh (Local)', status: 'active', featured: false,
  description: '', weight: '', ingredients: '', skinType: [], expiryDate: '',
  shelfLife: '', productCondition: 'NEW', gtin: '', images: [],
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

  // Fetch existing product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/products/${productId}?activeOnly=false`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        const p = data.product;

        // Map API response to form data
        const existingImages: ProductImage[] = (p.images || []).map((img: { id: string; url: string; altText?: string }, i: number) => ({
          id: img.id || String(i),
          preview: img.url,
          isMain: i === 0,
          existingUrl: img.url,
        }));

        const existingVariants: ProductVariant[] = p.variants && p.variants.length > 0
          ? p.variants.map((v: { id: string; attributes?: Record<string, string>; price: number; stock: number; sku?: string }) => ({
              id: v.id,
              size: v.attributes?.size || '',
              color: v.attributes?.color || '',
              price: String(v.price),
              stock: String(v.stock),
              sku: v.sku || '',
            }))
          : [{ id: '1', size: '', color: '', price: String(p.price || ''), stock: String(p.stock || 0), sku: '' }];

        setFormData({
          ...defaultFormData,
          name: p.name || '',
          category: p.category?.name || '',
          brand: p.brand?.name || '',
          status: p.isActive ? 'active' : 'inactive',
          featured: p.isFeatured || false,
          description: p.description || '',
          images: existingImages,
          imageAltTexts: existingImages.map((img: ProductImage & { altText?: string }) => img.altText || ''),
          variants: existingVariants,
          metaTitle: p.metaTitle || '',
          metaDescription: p.metaDescription || '',
          urlSlug: p.slug || '',
          tags: p.tags || '',
          bengaliProductName: p.bengaliName || '',
          bengaliMetaDescription: p.bengaliMetaDescription || '',
          focusKeyword: p.focusKeyword || '',
          ogTitle: p.ogTitle || '',
          ogImagePreview: p.ogImage || '',
          discountPercentage: p.discountPercentage ? String(p.discountPercentage) : '',
          salePrice: p.salePrice ? String(p.salePrice) : '',
          lowStockThreshold: p.lowStockThreshold ? String(p.lowStockThreshold) : '10',
          barcode: p.barcode || '',
          weight: p.weight ? String(p.weight) : '',
          returnEligible: p.returnEligible !== false,
          codAvailable: p.codAvailable !== false,
          freeShippingEligible: p.freeShippingEligible !== false,
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

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

  const handleSkinTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      skinType: prev.skinType.includes(type) ? prev.skinType.filter(t => t !== type) : [...prev.skinType, type],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: ProductImage[] = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      isMain: formData.images.length === 0,
    }));
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
      const newImages = prev.images.filter(img => img.id !== imageId);
      const newAltTexts = prev.imageAltTexts.filter((_, i) => i !== index);
      if (newImages.length > 0 && prev.images[index]?.isMain) newImages[0].isMain = true;
      return { ...prev, images: newImages, imageAltTexts: newAltTexts };
    });
  };

  const handleSetMainImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img => ({ ...img, isMain: img.id === imageId })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload new images (those with file property)
      const uploadedImages: Array<{ url: string; altText: string }> = [];

      for (let i = 0; i < formData.images.length; i++) {
        const img = formData.images[i];
        if (img.file) {
          // New image - upload to MinIO
          const uploadForm = new FormData();
          uploadForm.append('file', img.file);
          uploadForm.append('folder', `products/${productId}`);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
          if (!uploadRes.ok) throw new Error('Image upload failed');
          const uploadData = await uploadRes.json();
          uploadedImages.push({ url: uploadData.url, altText: formData.imageAltTexts[i] || '' });
        } else if (img.existingUrl) {
          // Existing image - keep it
          uploadedImages.push({ url: img.existingUrl, altText: formData.imageAltTexts[i] || '' });
        }
      }

      // Reorder so main image is first
      const mainIndex = formData.images.findIndex(img => img.isMain);
      if (mainIndex > 0) {
        const [main] = uploadedImages.splice(mainIndex, 1);
        uploadedImages.unshift(main);
      }

      const basePrice = formData.variants.length > 0 ? parseFloat(formData.variants[0].price) || 0 : 0;
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
        brand: formData.brand,
        status: formData.status,
        featured: formData.featured,
        images: uploadedImages,
        variants: formData.variants.map(v => ({
          size: v.size,
          color: v.color,
          price: parseFloat(v.price) || basePrice,
          stock: parseInt(v.stock) || 0,
          sku: v.sku,
          attributes: { size: v.size, color: v.color },
        })),
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        slug: formData.urlSlug,
        tags: formData.tags,
        bengaliName: formData.bengaliProductName,
        bengaliMetaDescription: formData.bengaliMetaDescription,
        focusKeyword: formData.focusKeyword,
        ogTitle: formData.ogTitle,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : 10,
        barcode: formData.barcode,
        returnEligible: formData.returnEligible,
        codAvailable: formData.codAvailable,
        freeShippingEligible: formData.freeShippingEligible,
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : undefined,
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
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Package className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter product name" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">Select Category</option>
                  {categoriesData.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                <select name="subcategory" value={formData.subcategory} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">Select Subcategory</option>
                  {subcategories.map((s: { name: string }) => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select name="item" value={formData.item} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">Select Item</option>
                  {items.map((item: string) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.brand ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter brand name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} className="rounded" />
                <span className="text-sm font-medium text-gray-700">Featured Product</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter product description" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <ImageIcon className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
          </div>

          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {formData.images.map((img, index) => (
              <div key={img.id} className={`relative group rounded-lg overflow-hidden border-2 ${img.isMain ? 'border-purple-500' : 'border-gray-200'}`}>
                <img src={img.preview} alt="" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button type="button" onClick={() => handleSetMainImage(img.id)}
                    className="px-1 py-0.5 bg-purple-600 text-white text-xs rounded">Main</button>
                  <button type="button" onClick={() => handleRemoveImage(img.id)}
                    className="p-1 bg-red-600 text-white rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
                {img.isMain && <span className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-xs text-center py-0.5">Main</span>}
                {img.existingUrl && !img.file && <span className="absolute top-1 left-1 bg-gray-800/70 text-white text-xs px-1 rounded">Saved</span>}
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">Add Image</span>
            </button>
          </div>
        </div>

        {/* Pricing & Variants */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Tag className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Pricing & Variants</h2>
            </div>
            <button type="button" onClick={handleAddVariant}
              className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm">
              <Plus className="w-4 h-4 mr-1" /> Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-700">Variant {index + 1}</span>
                  {formData.variants.length > 1 && (
                    <button type="button" onClick={() => handleRemoveVariant(variant.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                    <input type="text" value={variant.size || ''} onChange={e => handleVariantChange(variant.id, 'size', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" placeholder="30ml" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                    <input type="text" value={variant.color || ''} onChange={e => handleVariantChange(variant.id, 'color', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" placeholder="Black" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price (৳) *</label>
                    <input type="number" value={variant.price} onChange={e => handleVariantChange(variant.id, 'price', e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 ${errors[`variant_${variant.id}_price`] ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="0.00" step="0.01" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock *</label>
                    <input type="number" value={variant.stock} onChange={e => handleVariantChange(variant.id, 'stock', e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 ${errors[`variant_${variant.id}_stock`] ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="0" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SKU *</label>
                    <input type="text" value={variant.sku} onChange={e => handleVariantChange(variant.id, 'sku', e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 ${errors[`variant_${variant.id}_sku`] ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="SKU-001" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input type="number" name="discountPercentage" value={formData.discountPercentage} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="0" min="0" max="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offer Start</label>
              <input type="date" name="offerStartDate" value={formData.offerStartDate} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offer End</label>
              <input type="date" name="offerEndDate" value={formData.offerEndDate} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Search className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">SEO & Metadata</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="SEO title (max 60 chars)" maxLength={60} />
                <p className="text-xs text-gray-500 mt-1">{formData.metaTitle.length}/60</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <input type="text" name="urlSlug" value={formData.urlSlug} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="product-url-slug" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="SEO description (max 160 chars)" maxLength={160} />
              <p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bengali Product Name</label>
                <input type="text" name="bengaliProductName" value={formData.bengaliProductName} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="বাংলা নাম" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keyword</label>
                <input type="text" name="focusKeyword" value={formData.focusKeyword} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="main keyword" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="tag1, tag2, tag3" />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Product Options</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'returnEligible', label: 'Return Eligible' },
              { name: 'codAvailable', label: 'COD Available' },
              { name: 'freeShippingEligible', label: 'Free Shipping' },
              { name: 'flashSaleEligible', label: 'Flash Sale' },
            ].map(opt => (
              <label key={opt.name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name={opt.name} checked={formData[opt.name as keyof ProductFormData] as boolean}
                  onChange={handleChange} className="rounded" />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input type="text" name="barcode" value={formData.barcode} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="EAN/UPC barcode" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky bottom-0">
          <Link href="/admin/products"
            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
            <X className="w-5 h-5 mr-2" /> Cancel
          </Link>
          <button type="submit" disabled={isSubmitting}
            className="inline-flex items-center px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg">
            {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
