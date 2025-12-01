// src/components/v2/Header.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchDirectusNavigation, DirectusNavigationItem } from "@/lib/directus";

/**
 * HeaderV2 - Bold Navigation Header
 * Navy Blue & Gold Color Scheme (Different from V1 dark+red and V3 warm tones)
 */

// V2 Color Palette - Navy & Gold
const V2_COLORS = {
  primary: '#1a2744',       // Deep Navy
  primaryLight: '#2a3a5c',  // Lighter Navy
  secondary: '#c9a227',     // Rich Gold
  secondaryLight: '#dbb44a', // Light Gold
  text: '#ffffff',          // White
  textMuted: '#a8b2c4',     // Muted Blue-Gray
  accent: '#e8b923',        // Bright Gold
};

// Type definitions
type Category = {
  href: string;
  label: string;
  subcategories: { label: string; href: string }[];
};

type NavLink = {
  href: string;
  label: string;
  icon?: string;
};

// Fallback data
const DEFAULT_CATEGORIES: Category[] = [
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

const DEFAULT_NAV_LINKS: NavLink[] = [
  { href: "/lit-zone", label: "LIT ZONE", icon: "🔥" },
  { href: "/store-locator-map", label: "STORES", icon: "📍" },
  { href: "/about", label: "ABOUT", icon: "ℹ️" },
];

// Process CMS navigation into categories and quick links
function processNavigation(items: DirectusNavigationItem[]): { categories: Category[]; navLinks: NavLink[] } {
  const categories: Category[] = [];
  const navLinks: NavLink[] = [];
  
  const parentItems = items.filter(item => item.parent === null);
  
  parentItems.forEach(parent => {
    const isCategory = ["MEN", "WOMEN", "KIDS"].includes(parent.label.toUpperCase());
    
    if (isCategory) {
      const children = items
        .filter(item => item.parent === parent.id)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map(child => ({ label: child.label, href: child.href }));
      
      categories.push({
        href: parent.href,
        label: parent.label.toUpperCase(),
        subcategories: children,
      });
    } else {
      navLinks.push({
        href: parent.href,
        label: parent.label.toUpperCase(),
        icon: parent.highlight ? "🔥" : undefined,
      });
    }
  });
  
  return { categories, navLinks };
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [navLinks, setNavLinks] = useState<NavLink[]>(DEFAULT_NAV_LINKS);
  const pathname = usePathname();

  // Fetch navigation from CMS
  useEffect(() => {
    async function loadNavigation() {
      try {
        const navItems = await fetchDirectusNavigation();
        if (navItems && navItems.length > 0) {
          const { categories: cmsCategories, navLinks: cmsNavLinks } = processNavigation(navItems);
          if (cmsCategories.length > 0) setCategories(cmsCategories);
          if (cmsNavLinks.length > 0) setNavLinks(cmsNavLinks);
        }
      } catch (error) {
        console.error("Failed to load navigation from CMS:", error);
      }
    }
    loadNavigation();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Announcement Bar */}
      <div 
        className="relative overflow-hidden text-center py-2 text-xs tracking-[0.2em] uppercase"
        style={{ 
          background: `linear-gradient(90deg, ${V2_COLORS.secondary}, ${V2_COLORS.accent}, ${V2_COLORS.secondary})`,
          color: V2_COLORS.primary
        }}
      >
        <span className="font-semibold">✦ 50+ STORES ACROSS INDIA • VISIT YOUR NEAREST ZECODE STORE ✦</span>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500`}
        style={{ 
          backgroundColor: isScrolled ? 'rgba(26, 39, 68, 0.98)' : V2_COLORS.primary,
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          boxShadow: isScrolled ? '0 4px 30px rgba(0, 0, 0, 0.3)' : 'none'
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${V2_COLORS.secondary}40, transparent)` }}
        />

        <div className="max-w-[1600px] mx-auto px-6 md:px-16">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden relative w-10 h-10 flex flex-col justify-center items-center gap-1.5"
              aria-label="Toggle menu"
            >
              <span 
                className={`w-6 h-0.5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
                style={{ backgroundColor: V2_COLORS.text }}
              />
              <span 
                className={`w-6 h-0.5 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}
                style={{ backgroundColor: V2_COLORS.text }}
              />
              <span 
                className={`w-6 h-0.5 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
                style={{ backgroundColor: V2_COLORS.text }}
              />
            </button>

            {/* Left Navigation - Categories */}
            <nav className="hidden lg:flex items-center gap-1">
              {categories.map((category) => (
                <div
                  key={category.href}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(category.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={category.href}
                    className="group flex items-center gap-1 px-4 py-3 text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-300"
                    style={{ 
                      color: pathname?.startsWith(category.href) ? V2_COLORS.secondary : V2_COLORS.textMuted
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = V2_COLORS.text}
                    onMouseLeave={(e) => e.currentTarget.style.color = pathname?.startsWith(category.href) ? V2_COLORS.secondary : V2_COLORS.textMuted}
                  >
                    {category.label}
                    <svg className={`w-3 h-3 transition-transform duration-300 ${activeDropdown === category.label ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </Link>

                  {/* Dropdown */}
                  <div 
                    className={`absolute top-full left-0 min-w-[260px] backdrop-blur-xl overflow-hidden transition-all duration-300 ${
                      activeDropdown === category.label ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                    }`} 
                    style={{ 
                      backgroundColor: 'rgba(26, 39, 68, 0.98)',
                      border: `1px solid ${V2_COLORS.secondary}30`,
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' 
                    }}
                  >
                    <div 
                      className="h-1" 
                      style={{ background: `linear-gradient(90deg, ${V2_COLORS.secondary}, ${V2_COLORS.accent}, ${V2_COLORS.secondary})` }}
                    />
                    <Link 
                      href={category.href} 
                      className="flex items-center justify-between px-6 py-4 text-sm font-bold transition-all duration-200"
                      style={{ 
                        color: V2_COLORS.secondary,
                        borderBottom: `1px solid ${V2_COLORS.secondary}20`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = V2_COLORS.secondary;
                        e.currentTarget.style.color = V2_COLORS.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = V2_COLORS.secondary;
                      }}
                    >
                      <span>VIEW ALL {category.label}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                    <div className="py-2">
                      {category.subcategories.map((sub) => (
                        <Link 
                          key={sub.href} 
                          href={sub.href} 
                          className="group/sub flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200"
                          style={{ color: V2_COLORS.textMuted }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = V2_COLORS.text;
                            e.currentTarget.style.backgroundColor = `${V2_COLORS.primaryLight}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = V2_COLORS.textMuted;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span 
                            className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                            style={{ backgroundColor: V2_COLORS.textMuted }}
                          />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>

            {/* Center - Logo */}
            <Link href="/v2" className="relative group">
              <img 
                src="/brand/logo-full.svg" 
                alt="ZECODE" 
                className="h-8 md:h-10 w-auto brightness-0 invert"
              />
              <span 
                className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                style={{ backgroundColor: V2_COLORS.secondary }}
              />
            </Link>

            {/* Right Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-300"
                  style={{ color: pathname === link.href ? V2_COLORS.secondary : V2_COLORS.textMuted }}
                  onMouseEnter={(e) => e.currentTarget.style.color = V2_COLORS.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = pathname === link.href ? V2_COLORS.secondary : V2_COLORS.textMuted}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="lg:hidden w-10" />
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 z-[60] backdrop-blur-xl transition-all duration-500 lg:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        style={{ backgroundColor: 'rgba(26, 39, 68, 0.98)' }}
      >
        <div className="max-w-lg mx-auto px-6 pt-32">
          {categories.map((category, idx) => (
            <div key={category.label} style={{ borderBottom: `1px solid ${V2_COLORS.secondary}20` }}>
              <Link 
                href={category.href} 
                className="flex items-center justify-between py-5 text-xl font-bold tracking-wider uppercase"
                style={{ 
                  color: V2_COLORS.text,
                  transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(20px)', 
                  opacity: isMobileMenuOpen ? 1 : 0, 
                  transition: `all 0.5s ease ${idx * 0.1}s` 
                }}
              >
                {category.label}
                <svg className="w-5 h-5" style={{ color: V2_COLORS.textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
          {navLinks.map((link, idx) => (
            <div key={link.label} style={{ borderBottom: `1px solid ${V2_COLORS.secondary}20` }}>
              <Link 
                href={link.href} 
                className="flex items-center gap-3 py-5 text-xl font-bold tracking-wider uppercase"
                style={{ 
                  color: V2_COLORS.text,
                  transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(20px)', 
                  opacity: isMobileMenuOpen ? 1 : 0, 
                  transition: `all 0.5s ease ${(categories.length + idx) * 0.1}s` 
                }}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="absolute top-8 right-6 w-12 h-12 flex items-center justify-center" 
          style={{ color: V2_COLORS.text }}
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
