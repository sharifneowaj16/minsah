'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, X, TrendingUp, Clock, SlidersHorizontal,
  Star, Package, ChevronDown, ChevronUp, Filter, Volume2, VolumeX,
  Home, ChevronRight, AlertCircle
} from 'lucide-react';
import { formatPrice, convertUSDtoBDT } from '@/utils/currency';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images?: string[];
  image?: string;
  category?: string;
  brand?: string;
  rating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  isNewArrival?: boolean;
  highlighted?: { name?: string; description?: string };
}

interface Facet { value: string; count: number }

interface SearchResult {
  success: boolean;
  query: string;
  spellSuggestion: string | null;
  total: number;
  page: number;
  totalPages: number;
  products: Product[];
  fallback?: { strategy: string; message: string; applied: boolean };
  facets?: { categories: Facet[]; brands: Facet[]; priceRanges: Facet[] };
  priceStats?: { avg: number; min: number; max: number };
}

interface ApiSuggestion {
  type: 'product' | 'trending' | 'completion';
  text: string;
  productName?: string;
  slug?: string;
  price?: number;
  image?: string;
  count?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProductImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  return p.image ?? '';
}

function HighlightedText({ html, fallback }: { html?: string; fallback: string }) {
  if (!html) return <>{fallback}</>;
  return (
    <span
      className="[&_em]:not-italic [&_em]:font-bold [&_em]:text-pink-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven state
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialSort = searchParams.get('sort') || 'relevance';
  const initialInStock = searchParams.get('inStock') === 'true';

  // Input / search state
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);

  // Suggestions
  const [suggestions, setSuggestions] = useState<ApiSuggestion[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<ApiSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Search history (localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Filters sidebar
  const [showFilters, setShowFilters] = useState(false);

  // Voice search
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(
    typeof window !== 'undefined' && 'webkitSpeechRecognition' in window
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // ── Load recent searches ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('search_page_recent');
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 6));
    } catch { /* ignore */ }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('search_page_recent', JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  // ── Load trending searches on mount ────────────────────────────────────────
  useEffect(() => {
    fetch('/api/search/suggestions?trending=true&trendingLimit=8')
      .then(r => r.json())
      .then(d => { if (d.success) setTrendingSearches(d.suggestions ?? []); })
      .catch(() => { /* ignore */ });
  }, []);

  // ── Build search URL params ─────────────────────────────────────────────────
  const buildParams = useCallback((q: string, pg = 1) => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (category) p.set('category', category);
    if (brand) p.set('brand', brand);
    if (minPrice) p.set('minPrice', minPrice);
    if (maxPrice) p.set('maxPrice', maxPrice);
    if (inStockOnly) p.set('inStock', 'true');
    p.set('sort', sort);
    p.set('page', String(pg));
    p.set('limit', '20');
    return p;
  }, [category, brand, minPrice, maxPrice, inStockOnly, sort]);

  // ── Perform search ──────────────────────────────────────────────────────────
  const performSearch = useCallback(async (q: string, pg = 1) => {
    if (!q.trim() && !category && !brand) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const params = buildParams(q, pg);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      const data: SearchResult = await res.json();
      setResults(data);
      setPage(pg);
      // Update URL (no scroll)
      router.replace(`/search?${params.toString()}`, { scroll: false });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [buildParams, router]);

  // ── Run search when URL params change (initial load / navigation) ────────────
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch autocomplete suggestions ─────────────────────────────────────────
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}&limit=7`);
      const data = await res.json();
      if (data.success) setSuggestions(data.suggestions ?? []);
    } catch { /* ignore */ }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setActiveSuggestionIndex(-1);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 280);
  };

  const executeSearch = (q: string) => {
    if (!q.trim()) return;
    saveRecentSearch(q.trim());
    setInputValue(q.trim());
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    performSearch(q.trim(), 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          const s = suggestions[activeSuggestionIndex];
          if (s.type === 'product' && s.slug) {
            router.push(`/products/${s.slug}`);
          } else {
            executeSearch(s.text);
          }
        } else {
          executeSearch(inputValue);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // ── Voice search ────────────────────────────────────────────────────────────
  const startVoice = () => {
    if (!voiceSupported) return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      executeSearch(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ── Close suggestions on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasResults = results && results.products.length > 0;
  const hasSearched = results !== null || loading;

  return (
    <div className="min-h-screen bg-minsah-light pb-20">
      {/* ── Search Header ── */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-minsah-secondary mb-3">
            <Link href="/" className="flex items-center gap-1 hover:text-minsah-primary transition-colors">
              <Home size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-minsah-dark font-medium">Search</span>
            {results?.query && (
              <>
                <ChevronRight size={12} />
                <span className="text-minsah-primary font-medium truncate max-w-[150px]">&ldquo;{results.query}&rdquo;</span>
              </>
            )}
          </div>

          {/* Search bar */}
          <div className="search-container relative">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-minsah-primary focus-within:ring-2 focus-within:ring-minsah-primary/20 transition-all overflow-hidden">
              <div className="pl-4 flex-shrink-0">
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-minsah-primary border-t-transparent" />
                ) : (
                  <Search size={20} className="text-gray-400" />
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search beauty products..."
                className="flex-1 py-3.5 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                autoFocus
              />

              {/* Voice search */}
              {voiceSupported && (
                <button
                  onClick={isListening ? stopVoice : startVoice}
                  className={`p-2 mx-1 rounded-xl transition-colors ${
                    isListening
                      ? 'bg-red-100 text-red-600 animate-pulse'
                      : 'text-gray-400 hover:text-minsah-primary hover:bg-gray-100'
                  }`}
                  aria-label="Voice search"
                >
                  {isListening ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}

              {inputValue && (
                <button
                  onClick={() => { setInputValue(''); setSuggestions([]); inputRef.current?.focus(); }}
                  className="p-2 mx-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}

              <button
                onClick={() => executeSearch(inputValue)}
                className="px-5 py-3.5 bg-minsah-primary text-white text-sm font-semibold hover:bg-minsah-dark transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (s.type === 'product' && s.slug) {
                        router.push(`/products/${s.slug}`);
                      } else {
                        executeSearch(s.text);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 text-left transition-colors border-b border-gray-50 last:border-0 ${
                      i === activeSuggestionIndex ? 'bg-pink-50' : ''
                    }`}
                  >
                    {s.image ? (
                      <img src={s.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                        {s.type === 'trending'
                          ? <TrendingUp size={16} className="text-orange-400" />
                          : <Search size={16} className="text-gray-400" />
                        }
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.productName || s.text}</p>
                      {s.price && s.price > 0 && (
                        <p className="text-xs text-gray-500">{formatPrice(convertUSDtoBDT(s.price))}</p>
                      )}
                    </div>
                    {s.type === 'trending' && (
                      <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        🔥 Trending
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => executeSearch(inputValue)}
                  className="w-full px-4 py-3 text-sm text-minsah-primary font-semibold hover:bg-pink-50 text-left border-t border-gray-100 transition-colors"
                >
                  Search all results for &ldquo;{inputValue}&rdquo; →
                </button>
              </div>
            )}
          </div>

          {/* Filter controls row */}
          {hasSearched && (
            <div className="flex items-center justify-between mt-3 gap-2">
              <div className="flex items-center gap-2 text-sm text-minsah-secondary">
                {results && (
                  <span>
                    <span className="font-semibold text-minsah-dark">{results.total}</span> results
                    {results.query && <> for <span className="text-minsah-primary font-medium">&ldquo;{results.query}&rdquo;</span></>}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value); performSearch(inputValue, 1); }}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-minsah-primary/20 text-gray-700"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest First</option>
                </select>

                {/* Filters toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
                    showFilters
                      ? 'bg-minsah-primary text-white border-minsah-primary'
                      : 'border-gray-200 text-gray-700 hover:border-minsah-primary hover:text-minsah-primary'
                  }`}
                >
                  <Filter size={14} />
                  Filters
                  {(category || brand || minPrice || maxPrice || inStockOnly) && (
                    <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] font-bold flex items-center justify-center">
                      •
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Category</label>
                  {results?.facets?.categories && results.facets.categories.length > 0 ? (
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-minsah-primary/20"
                    >
                      <option value="">All Categories</option>
                      {results.facets.categories.map(f => (
                        <option key={f.value} value={f.value}>
                          {f.value} ({f.count})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="e.g. skincare"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-minsah-primary/20"
                    />
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Brand</label>
                  {results?.facets?.brands && results.facets.brands.length > 0 ? (
                    <select
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-minsah-primary/20"
                    >
                      <option value="">All Brands</option>
                      {results.facets.brands.map(f => (
                        <option key={f.value} value={f.value}>
                          {f.value} ({f.count})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      placeholder="e.g. MAC"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-minsah-primary/20"
                    />
                  )}
                </div>

                {/* Price range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Price (৳)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
                    />
                    <span className="text-gray-400 text-xs">–</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* In stock + actions */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Availability</label>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e => setInStockOnly(e.target.checked)}
                      className="rounded border-gray-300 text-minsah-primary"
                    />
                    <span className="text-sm text-gray-700">In Stock Only</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => performSearch(inputValue, 1)}
                      className="flex-1 py-2 text-xs bg-minsah-primary text-white rounded-lg font-semibold hover:bg-minsah-dark transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        setCategory(''); setBrand(''); setMinPrice(''); setMaxPrice('');
                        setInStockOnly(false);
                      }}
                      className="flex-1 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 py-6">

        {/* ── Spell Correction (Did you mean?) ── */}
        {results?.spellSuggestion && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
            <AlertCircle size={16} className="text-yellow-600 flex-shrink-0" />
            <span className="text-yellow-800">
              Did you mean:{' '}
              <button
                onClick={() => {
                  setInputValue(results.spellSuggestion!);
                  executeSearch(results.spellSuggestion!);
                }}
                className="font-semibold text-minsah-primary underline underline-offset-2 hover:text-minsah-dark"
              >
                {results.spellSuggestion}
              </button>
              ?
            </span>
          </div>
        )}

        {/* ── Fallback message ── */}
        {results?.fallback?.applied && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-600 flex-shrink-0" />
            {results.fallback.message}
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* ── Results grid ── */}
        {!loading && hasResults && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.products.map(product => {
                const image = getProductImage(product);
                const bdtPrice = convertUSDtoBDT(product.price);
                const bdtOriginal = product.compareAtPrice ? convertUSDtoBDT(product.compareAtPrice) : null;
                const discount = bdtOriginal
                  ? Math.round(((bdtOriginal - bdtPrice) / bdtOriginal) * 100)
                  : 0;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-gray-50">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={40} className="text-gray-300" />
                        </div>
                      )}
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.isFlashSale && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">SALE</span>
                        )}
                        {product.isNewArrival && (
                          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">NEW</span>
                        )}
                        {product.isFeatured && (
                          <span className="bg-minsah-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">★</span>
                        )}
                      </div>
                      {discount > 0 && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      {product.brand && (
                        <p className="text-[10px] text-minsah-secondary uppercase tracking-wider mb-0.5 font-medium">
                          {product.brand}
                        </p>
                      )}
                      <h3 className="text-sm font-semibold text-minsah-dark line-clamp-2 mb-1 min-h-[2.5rem]">
                        <HighlightedText html={product.highlighted?.name} fallback={product.name} />
                      </h3>

                      {product.rating && product.rating > 0 && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <Star size={11} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-[11px] text-gray-600 font-medium">{product.rating.toFixed(1)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-minsah-primary">{formatPrice(bdtPrice)}</span>
                          {bdtOriginal && bdtOriginal > bdtPrice && (
                            <span className="text-xs text-gray-400 line-through ml-1.5">{formatPrice(bdtOriginal)}</span>
                          )}
                        </div>
                        {product.inStock === false && (
                          <span className="text-[10px] text-red-500 font-medium">Out of stock</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {results.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => performSearch(inputValue, page - 1)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-minsah-primary hover:text-minsah-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {results.totalPages}
                </span>
                <button
                  disabled={page >= results.totalPages}
                  onClick={() => performSearch(inputValue, page + 1)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-minsah-primary hover:text-minsah-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* ── No results ── */}
        {!loading && results && results.products.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-minsah-dark mb-2">No products found</h3>
            <p className="text-minsah-secondary mb-6">
              We couldn&apos;t find anything for &ldquo;{results.query}&rdquo;. Try different keywords or browse our categories.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/shop"
                className="px-5 py-2.5 bg-minsah-primary text-white rounded-xl font-semibold text-sm hover:bg-minsah-dark transition-colors"
              >
                Browse All Products
              </Link>
              <Link
                href="/categories"
                className="px-5 py-2.5 border border-minsah-primary text-minsah-primary rounded-xl font-semibold text-sm hover:bg-minsah-primary hover:text-white transition-colors"
              >
                Shop by Category
              </Link>
            </div>
          </div>
        )}

        {/* ── Empty state (no search yet) ── */}
        {!loading && !hasSearched && (
          <div className="py-8">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-minsah-dark flex items-center gap-2">
                    <Clock size={18} className="text-minsah-secondary" />
                    Recent Searches
                  </h2>
                  <button
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('search_page_recent');
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => executeSearch(s)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-minsah-primary hover:text-minsah-primary transition-colors shadow-sm"
                    >
                      <Clock size={13} className="text-gray-400" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending searches */}
            {trendingSearches.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-bold text-minsah-dark mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-orange-500" />
                  Trending Searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => executeSearch(s.text)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-100 rounded-full text-sm text-orange-700 font-medium hover:from-orange-100 hover:to-pink-100 transition-colors"
                    >
                      🔥 {s.text}
                      {s.count && <span className="text-xs text-orange-400">({s.count})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick category links */}
            <div>
              <h2 className="text-base font-bold text-minsah-dark mb-4">Popular Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Makeup', icon: '💄', slug: 'makeup' },
                  { name: 'Skincare', icon: '✨', slug: 'skincare' },
                  { name: 'Haircare', icon: '💇', slug: 'haircare' },
                  { name: 'Perfume', icon: '🌸', slug: 'perfume' },
                ].map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => executeSearch(cat.name.toLowerCase())}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-minsah-primary hover:shadow-sm transition-all text-left"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-sm font-semibold text-minsah-dark">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
