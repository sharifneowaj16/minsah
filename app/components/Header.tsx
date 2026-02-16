'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import MegaMenu from './MegaMenu';
import MobileMenu from './MobileMenu';
import { User, Heart, ShoppingCart } from 'lucide-react';

export default function Navbar() {
  const [cartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed left-4 right-4 z-50 transition-all duration-300 ${
        isScrolled ? 'top-4' : 'top-12'
      } ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-md rounded-3xl'
          : 'bg-transparent'
      }`}
      style={{
        backgroundColor: isScrolled ? 'rgba(252, 237, 234, 0.9)' : 'transparent'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${isScrolled ? 'h-16' : 'h-20'} transition-all duration-300`}>
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-black transition-colors duration-300">
              Minsah Beauty
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="/"
              className="text-black hover:text-black/80 transition-colors duration-300"
            >
              Home
            </Link>
            <MegaMenu />
            {/* User Icon */}
            <Link
              href="/login"
              className="relative"
              aria-label="Login"
            >
              <User className="w-6 h-6 text-black hover:text-black/80 transition-colors duration-300" />
            </Link>
            {/* Wishlist Icon */}
            <Link href="/wishlist" className="relative">
              <Heart className="w-6 h-6 text-black hover:text-black/80 transition-colors duration-300" />
            </Link>
            {/* Cart Icon */}
            <Link href="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-black hover:text-black/80 transition-colors duration-300" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#d4a574' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center space-x-4">
            <MobileMenu itemCount={cartCount} />
          </div>
        </div>
      </div>
    </nav>
  );
}
