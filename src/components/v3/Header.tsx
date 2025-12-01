// src/components/v3/Header.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDirectusNavigation, DirectusNavigationItem } from "@/lib/directus";

/**
 * HeaderV3 - Minimal Floating Navigation
 * Warm, Earthy Color Scheme for V3 Parallax Theme
 */

// V3 Color Palette - Warm Tones
const V3_COLORS = {
  background: '#F5F1ED',
  backgroundDark: '#E8E2DB',
  text: '#2D2926',
  textLight: '#6B635B',
  accent: '#C4704C',
  accentHover: '#A85A3A',
};

type NavLink = { href: string; label: string };

const DEFAULT_NAV_LINKS: NavLink[] = [
  { href: "/men", label: "MEN" },
  { href: "/women", label: "WOMEN" },
  { href: "/kids", label: "KIDS" },
  { href: "/store-locator-map", label: "STORES" },
];

// Process CMS navigation - V3 only shows top-level items
function processNavigation(items: DirectusNavigationItem[]): NavLink[] {
  return items
    .filter(item => item.parent === null)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map(item => ({
      href: item.href,
      label: item.label.toUpperCase(),
    }));
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLink[]>(DEFAULT_NAV_LINKS);

  // Fetch navigation from CMS
  useEffect(() => {
    async function loadNavigation() {
      try {
        const navItems = await fetchDirectusNavigation();
        if (navItems && navItems.length > 0) {
          const links = processNavigation(navItems);
          if (links.length > 0) setNavLinks(links);
        }
      } catch (error) {
        console.error("Failed to load navigation from CMS:", error);
      }
    }
    loadNavigation();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
        style={{
          backgroundColor: isScrolled ? 'rgba(245, 241, 237, 0.95)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          padding: isScrolled ? '1rem 0' : '1.5rem 0',
          boxShadow: isScrolled ? '0 2px 20px rgba(45, 41, 38, 0.1)' : 'none',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/v3" className="relative group">
            <img 
              src="/brand/logo-full.svg" 
              alt="ZECODE" 
              className="h-7 md:h-9 w-auto"
            />
            <span 
              className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
              style={{ backgroundColor: V3_COLORS.accent }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-[0.15em] uppercase transition-colors duration-300"
                style={{ color: V3_COLORS.textLight }}
                onMouseEnter={(e) => e.currentTarget.style.color = V3_COLORS.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = V3_COLORS.textLight}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5"
            aria-label="Toggle menu"
          >
            <span 
              className={`w-6 h-0.5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
              style={{ backgroundColor: V3_COLORS.text }}
            />
            <span 
              className={`w-6 h-0.5 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}
              style={{ backgroundColor: V3_COLORS.text }}
            />
            <span 
              className={`w-6 h-0.5 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              style={{ backgroundColor: V3_COLORS.text }}
            />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 z-[60] backdrop-blur-xl transition-all duration-500 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        style={{ backgroundColor: 'rgba(245, 241, 237, 0.98)' }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-3xl font-light tracking-wider uppercase"
              style={{
                color: V3_COLORS.text,
                transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                opacity: isMobileMenuOpen ? 1 : 0,
                transition: `all 0.5s ease ${idx * 0.1}s`,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white"
          aria-label="Close menu"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}
