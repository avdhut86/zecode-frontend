"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

// Category data with subcategories
const CATEGORIES = [
  {
    href: "/men",
    label: "MEN",
    subcategories: [
      { label: "T-SHIRTS", href: "/men/tshirts" },
      { label: "SHIRTS", href: "/men/shirts" },
      { label: "JEANS", href: "/men/jeans" },
      { label: "TROUSERS", href: "/men/trousers" },
      { label: "JACKETS", href: "/men/jackets" },
      { label: "SHOES", href: "/men/shoes" },
    ],
  },
  {
    href: "/women",
    label: "WOMEN",
    subcategories: [
      { label: "TOPS", href: "/women/tops" },
      { label: "DRESSES", href: "/women/dresses" },
      { label: "JEANS", href: "/women/jeans" },
      { label: "SKIRTS", href: "/women/skirts" },
      { label: "JACKETS", href: "/women/jackets" },
      { label: "SHOES", href: "/women/shoes" },
    ],
  },
  {
    href: "/kids",
    label: "KIDS",
    subcategories: [
      { label: "BOYS T-SHIRTS", href: "/kids/boys-tshirts" },
      { label: "GIRLS TOPS", href: "/kids/girls-tops" },
      { label: "BOYS JEANS", href: "/kids/boys-jeans" },
      { label: "GIRLS DRESSES", href: "/kids/girls-dresses" },
      { label: "JACKETS", href: "/kids/jackets" },
      { label: "SHOES", href: "/kids/shoes" },
    ],
  },
];

export default function Header() {
  const { colors } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <>
      <header
        className="text-white sticky top-0 z-50 transition-all duration-300"
        style={{ 
          backgroundColor: colors.header.background,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Top Bar - Promotional Banner with animation */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#C83232] via-[#e63946] to-[#C83232] text-white text-center py-0.5 text-xs font-medium tracking-wider">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <span className="relative z-10">🔥 FREE SHIPPING ON ORDERS ABOVE ₹999 | SHOP NOW 🔥</span>
        </div>

        {/* Main Header with subtle gradient overlay */}
        <div className="relative">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="container mx-auto px-4 md:px-6">
            {/* Single Row Header - Logo with Navigation on both sides */}
            <div className="flex items-center justify-between py-0">
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              {/* Left Nav - Categories with Dropdowns (Desktop) */}
              <nav className="hidden md:flex items-center gap-1">
                {CATEGORIES.map((category) => (
                  <div 
                    key={category.href}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(category.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link 
                      href={category.href} 
                      className="group flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-300"
                    >
                      <span className="text-sm font-bold tracking-[0.15em] uppercase text-white/90 group-hover:text-white transition-colors duration-300">
                        {category.label}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={2.5} 
                        stroke="currentColor" 
                        className={`w-3 h-3 text-white/70 transition-transform duration-300 ${activeDropdown === category.label ? 'rotate-180' : ''}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </Link>
                    
                    {/* Dropdown Menu - Enhanced */}
                    <div 
                      className={`absolute top-full left-0 min-w-[220px] bg-gradient-to-b from-black/98 to-black/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
                        activeDropdown === category.label 
                          ? 'opacity-100 visible translate-y-0' 
                          : 'opacity-0 invisible -translate-y-2'
                      }`}
                      style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)' }}
                    >
                      {/* Dropdown top accent */}
                      <div className="h-0.5 bg-gradient-to-r from-[#C83232] via-[#e63946] to-[#C83232]"></div>
                      
                      {/* View All Link */}
                      <Link 
                        href={category.href}
                        className="group/link flex items-center justify-between px-5 py-3.5 text-sm font-bold text-[#C83232] hover:bg-[#C83232] hover:text-white transition-all duration-200 border-b border-white/10"
                      >
                        <span>VIEW ALL {category.label}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                      
                      {/* Subcategory Links */}
                      <div className="py-2">
                        {category.subcategories.map((sub, idx) => (
                          <Link 
                            key={sub.href}
                            href={sub.href}
                            className="group/sub flex items-center gap-3 px-5 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/5 transition-all duration-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white/30 group-hover/sub:bg-[#C83232] group-hover/sub:scale-125 transition-all duration-200"></span>
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </nav>

              {/* Logo - Centered */}
              <Link href="/" className="flex items-center relative group">
                <div className="absolute inset-0 bg-[#C83232]/0 group-hover:bg-[#C83232]/10 rounded-xl blur-xl transition-all duration-500"></div>
                <Image
                  src="/brand/logo-full.svg"
                  alt="ZECODE"
                  width={500}
                  height={150}
                  className="h-16 md:h-20 w-auto object-contain relative z-10"
                  priority
                />
              </Link>

              {/* Right Nav - Utility Links (Desktop) */}
              <nav className="hidden md:flex items-center gap-2">
                <Link 
                  href="/lit-zone"
                  className="icon-fire-container flex items-center gap-1.5 px-4 py-2.5 rounded-lg hover:bg-white/5 text-sm font-bold tracking-wider uppercase text-white/90 hover:text-white transition-all duration-300"
                >
                  <span className="icon-fire text-base">🔥</span>
                  <span className="relative">
                    LIT ZONE
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#C83232] to-[#e63946] transition-all duration-300" style={{ width: '0%' }}></span>
                  </span>
                </Link>
                
                <Link 
                  href="/store-locator-map"
                  className="icon-pin-container flex items-center gap-1.5 px-4 py-2.5 rounded-lg hover:bg-white/5 text-sm font-bold tracking-wider uppercase text-white/90 hover:text-white transition-all duration-300"
                >
                  <span className="icon-pin text-base">📍</span>
                  <span className="relative">
                    STORES
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#C83232] to-[#e63946] transition-all duration-300" style={{ width: '0%' }}></span>
                  </span>
                </Link>
                
                <Link 
                  href="/about"
                  className="icon-info-container flex items-center gap-1.5 px-4 py-2.5 rounded-lg hover:bg-white/5 text-sm font-bold tracking-wider uppercase text-white/90 hover:text-white transition-all duration-300"
                >
                  <span className="icon-info text-base">ℹ️</span>
                  <span className="relative">
                    ABOUT
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#C83232] to-[#e63946] transition-all duration-300" style={{ width: '0%' }}></span>
                  </span>
                </Link>
              </nav>

              {/* Placeholder for right side on mobile */}
              <div className="md:hidden w-10"></div>
            </div>
          </div>
          
          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-all duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Slide-in Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-black via-black/98 to-black z-50 transform transition-transform duration-300 ease-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ boxShadow: mobileMenuOpen ? '10px 0 40px rgba(0, 0, 0, 0.5)' : 'none' }}
      >
        {/* Decorative side accent */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-[#C83232]/50 via-white/10 to-transparent"></div>
        
        {/* Mobile Menu Header */}
        <div className="relative flex items-center justify-between p-5 border-b border-white/10">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#C83232] via-white/20 to-transparent"></div>
          <Image
            src="/brand/logo-full.svg"
            alt="ZECODE"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-white p-2 hover:bg-white/10 hover:rotate-90 rounded-lg transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Categories with Accordions */}
        <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
          <p className="text-[#C83232] text-xs uppercase tracking-[0.2em] mb-4 font-bold flex items-center gap-2">
            <span className="w-8 h-[1px] bg-[#C83232]"></span>
            Shop By Category
          </p>
          <nav className="flex flex-col gap-1">
            {CATEGORIES.map((category) => (
              <div key={category.href} className="border-b border-white/5 last:border-b-0">
                {/* Category Header - Accordion Toggle */}
                <button 
                  onClick={() => setActiveDropdown(activeDropdown === category.label ? null : category.label)}
                  className="flex items-center justify-between w-full py-3 px-4 text-white text-lg font-bold tracking-wider uppercase hover:bg-white/5 rounded-lg transition-all duration-300 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{category.label}</span>
                  <div className={`w-6 h-6 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 ${activeDropdown === category.label ? 'bg-[#C83232] border-[#C83232] rotate-180' : ''}`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2} 
                      stroke="currentColor" 
                      className="w-3 h-3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>
                
                {/* Subcategories - Accordion Content */}
                <div className={`overflow-hidden transition-all duration-300 ${activeDropdown === category.label ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="pl-4 pb-3 border-l-2 border-[#C83232]/30 ml-4">
                    {/* View All Link */}
                    <Link 
                      href={category.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-2 px-4 text-sm font-bold text-[#C83232] hover:bg-[#C83232] hover:text-white rounded-lg transition-all duration-200"
                    >
                      VIEW ALL {category.label}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                    
                    {/* Subcategory Links */}
                    {category.subcategories.map((sub) => (
                      <Link 
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 py-2 px-4 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                      >
                        <span className="w-1 h-1 rounded-full bg-white/40"></span>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Mobile Menu Links */}
        <div className="p-5 border-t border-white/10">
          <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-4 font-bold flex items-center gap-2">
            <span className="w-8 h-[1px] bg-white/30"></span>
            Quick Links
          </p>
          <nav className="flex flex-col gap-1">
            {[
              { href: "/lit-zone", label: "LIT ZONE", icon: "🔥" },
              { href: "/store-locator-map", label: "FIND A STORE", icon: "📍" },
              { href: "/about", label: "ABOUT US", icon: "ℹ️" },
            ].map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center gap-3 py-3 px-4 text-white/80 font-medium tracking-wide hover:bg-white/5 rounded-lg transition-all duration-300"
              >
                <span className="text-lg group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Menu Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/10 bg-gradient-to-t from-black to-transparent">
          <p className="text-white/40 text-xs text-center tracking-wider">
            © 2025 ZECODE. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
