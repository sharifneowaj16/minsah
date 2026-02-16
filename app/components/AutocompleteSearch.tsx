'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brush,
  Package,
  Star,
  Droplets,
  Sparkles,
  Flower,
  ChevronUp,
  ChevronDown,
  Palette,
  Eye,
  PenTool,
  Target,
  Heart,
  Sun,
  Zap,
  Shield,
  Smile,
  Leaf,
  Moon,
  Flower2,
  Wrench,
  Paintbrush,
  Square
} from 'lucide-react';

// Define a type for the icon components
type IconComponent = React.ComponentType<{ className?: string }>;

// Beauty product suggestions with categories
const BEAUTY_SUGGESTIONS = [
  // Makeup
  { id: 1, text: 'lipstick', category: 'makeup', icon: Heart as IconComponent },
  { id: 2, text: 'foundation', category: 'makeup', icon: Palette as IconComponent },
  { id: 3, text: 'mascara', category: 'makeup', icon: Eye as IconComponent },
  { id: 4, text: 'eyeliner', category: 'makeup', icon: PenTool as IconComponent },
  { id: 5, text: 'eyeshadow palette', category: 'makeup', icon: Palette as IconComponent },
  { id: 6, text: 'concealer', category: 'makeup', icon: Target as IconComponent },
  { id: 7, text: 'blush', category: 'makeup', icon: Heart as IconComponent },
  { id: 8, text: 'bronzer', category: 'makeup', icon: Sun as IconComponent },
  { id: 9, text: 'primer', category: 'makeup', icon: Zap as IconComponent },
  { id: 10, text: 'setting spray', category: 'makeup', icon: Droplets as IconComponent },

  // Skincare
  { id: 11, text: 'face wash', category: 'skincare', icon: Droplets as IconComponent },
  { id: 12, text: 'moisturizer', category: 'skincare', icon: Droplets as IconComponent },
  { id: 13, text: 'serum', category: 'skincare', icon: Sparkles as IconComponent },
  { id: 14, text: 'sunscreen', category: 'skincare', icon: Shield as IconComponent },
  { id: 15, text: 'face mask', category: 'skincare', icon: Smile as IconComponent },
  { id: 16, text: 'toner', category: 'skincare', icon: Leaf as IconComponent },
  { id: 17, text: 'exfoliator', category: 'skincare', icon: Sparkles as IconComponent },
  { id: 18, text: 'night cream', category: 'skincare', icon: Moon as IconComponent },
  { id: 19, text: 'eye cream', category: 'skincare', icon: Eye as IconComponent },
  { id: 20, text: 'lip balm', category: 'skincare', icon: Heart as IconComponent },

  // Hair Care
  { id: 21, text: 'shampoo', category: 'haircare', icon: Package as IconComponent },
  { id: 22, text: 'conditioner', category: 'haircare', icon: Droplets as IconComponent },
  { id: 23, text: 'hair oil', category: 'haircare', icon: Droplets as IconComponent },
  { id: 24, text: 'hair mask', category: 'haircare', icon: Package as IconComponent },
  { id: 25, text: 'hair serum', category: 'haircare', icon: Sparkles as IconComponent },

  // Perfume
  { id: 26, text: 'perfume', category: 'perfume', icon: Flower2 as IconComponent },
  { id: 27, text: 'body spray', category: 'perfume', icon: Flower as IconComponent },
  { id: 28, text: 'deodorant', category: 'perfume', icon: Leaf as IconComponent },
  { id: 29, text: 'essential oils', category: 'perfume', icon: Droplets as IconComponent },

  // Nail Care
  { id: 30, text: 'nail polish', category: 'nails', icon: Star as IconComponent },
  { id: 31, text: 'nail art', category: 'nails', icon: Palette as IconComponent },
  { id: 32, text: 'cuticle oil', category: 'nails', icon: Droplets as IconComponent },

  // Tools & Accessories
  { id: 33, text: 'makeup brushes', category: 'tools', icon: Paintbrush as IconComponent },
  { id: 34, text: 'beauty blender', category: 'tools', icon: Square as IconComponent },
  { id: 35, text: 'eyelash curler', category: 'tools', icon: Wrench as IconComponent },
];

interface AutocompleteSearchProps {
  placeholder?: string;
  maxSuggestions?: number;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function AutocompleteSearch({
  placeholder = 'Search for beauty products...',
  maxSuggestions = 5,
  onSearch,
  className = ''
}: AutocompleteSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState(BEAUTY_SUGGESTIONS);
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof BEAUTY_SUGGESTIONS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input (case-insensitive)
  const filterSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredSuggestions([]);
      return;
    }

    const filtered = BEAUTY_SUGGESTIONS.filter(suggestion =>
      suggestion.text.toLowerCase().includes(query.toLowerCase()) ||
      suggestion.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, maxSuggestions);

    setFilteredSuggestions(filtered);
    setActiveSuggestionIndex(0);
  }, [maxSuggestions]);

  // Highlight matching text in suggestion
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="font-semibold text-pink-600">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);
    filterSuggestions(value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setShowSuggestions(true);
    if (inputValue.trim()) {
      filterSuggestions(inputValue);
    } else {
      setFilteredSuggestions(BEAUTY_SUGGESTIONS.slice(0, maxSuggestions));
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: typeof BEAUTY_SUGGESTIONS[0]) => {
    setInputValue(suggestion.text);
    setShowSuggestions(false);
    setIsHighlighted(false);
    onSearch?.(suggestion.text);
  };

  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const suggestionsList = filteredSuggestions.length > 0 ? filteredSuggestions : BEAUTY_SUGGESTIONS.slice(0, maxSuggestions);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setShowSuggestions(true);
        setIsHighlighted(true);
        setActiveSuggestionIndex((prev) =>
          prev < suggestionsList.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setShowSuggestions(true);
        setIsHighlighted(true);
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestionsList.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (showSuggestions && suggestionsList.length > 0) {
          const selectedSuggestion = suggestionsList[activeSuggestionIndex];
          setInputValue(selectedSuggestion.text);
          setShowSuggestions(false);
          setIsHighlighted(false);
          onSearch?.(selectedSuggestion.text);
        } else if (inputValue.trim()) {
          onSearch?.(inputValue);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setIsHighlighted(false);
        setActiveSuggestionIndex(0);
        break;
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch?.(inputValue);
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current !== event.target
      ) {
        setShowSuggestions(false);
        setIsHighlighted(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set initial suggestions
  useEffect(() => {
    setFilteredSuggestions(BEAUTY_SUGGESTIONS.slice(0, maxSuggestions));
  }, [maxSuggestions]);

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
          />

          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                setShowSuggestions(false);
                setFilteredSuggestions(BEAUTY_SUGGESTIONS.slice(0, maxSuggestions));
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {filteredSuggestions.length > 0 ? (
            <div className="py-1">
              {filteredSuggestions.map((suggestion, index) => {
                const isActive = isHighlighted && index === activeSuggestionIndex;
                const categoryColors = {
                  makeup: 'bg-pink-50 text-pink-700',
                  skincare: 'bg-green-50 text-green-700',
                  haircare: 'bg-purple-50 text-purple-700',
                  perfume: 'bg-blue-50 text-blue-700',
                  nails: 'bg-yellow-50 text-yellow-700',
                  tools: 'bg-gray-50 text-gray-700'
                };
                const IconComponent = suggestion.icon;

                return (
                  <div
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`flex items-center px-4 py-3 cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'bg-pink-50 border-l-4 border-pink-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Icon */}
                    <span className="mr-3 flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-gray-400" />
                    </span>

                    {/* Suggestion Text */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {highlightText(suggestion.text, inputValue)}
                      </div>
                    </div>

                    {/* Category Badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2 flex-shrink-0 ${
                      categoryColors[suggestion.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {suggestion.category}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : inputValue.trim() ? (
            /* No Results */
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <svg
                className="h-10 w-10 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-500">
                No suggestions found for "{inputValue}"
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try typing different keywords
              </p>
            </div>
          ) : (
            /* Popular Suggestions */
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Popular Searches
              </div>
              {filteredSuggestions.slice(0, 5).map((suggestion, index) => {
                const isActive = isHighlighted && index === activeSuggestionIndex;
                const IconComponent = suggestion.icon;

                return (
                  <div
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`flex items-center px-4 py-3 cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'bg-pink-50 border-l-4 border-pink-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3 flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-gray-400" />
                    </span>
                    <span className="text-sm text-gray-700">
                      {suggestion.text}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {suggestion.category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Keyboard Navigation Hint */}
          {filteredSuggestions.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Use <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs flex items-center justify-center inline-flex">
                  <ChevronUp className="h-3 w-3" />
                </kbd>
                <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs ml-1 flex items-center justify-center inline-flex">
                  <ChevronDown className="h-3 w-3" />
                </kbd> to navigate,
                <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs ml-1">Enter</kbd> to select
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}