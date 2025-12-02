"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchDirectusNavigation, DirectusNavigationItem, fetchProductCounts } from "@/lib/directus";

// Mapping from URL slugs to CMS subcategory values for proper matching
const SLUG_TO_CMS_SUBCATEGORY: Record<string, string[]> = {
  // Men
  'tshirts': ['t', 'tshirt', 't-shirt'],
  'shirts': ['shirt'],
  'jeans': ['jean', 'jeans'],
  'trousers': ['trouser', 'trousers', 'pants', 'pant'],
  'jackets': ['jacket', 'outerwear'],
  'shoes': ['shoe', 'flats', 'flat'],
  // Women
  'tops': ['top', 'tops'],
  'dresses': ['dress', 'dresses'],
  'skirts': ['skirt', 'skirts'],
  // Kids - special mappings
  'boys-tshirts': ['t', 'tshirt', 't-shirt'],
  'girls-tops': ['top', 'tops'],
  'boys-jeans': ['bottom', 'bottoms', 'jean', 'jeans'],
  'girls-dresses': ['dress', 'dresses'],
  // Footwear - gender-based subcategories
  'men': ['flats', 'flat', 'mules', 'mule', 'sneakers', 'sneaker', 'boots', 'boot', 'loafers', 'loafer', 'sandals', 'sandal'],
  'women': ['flats', 'flat', 'mules', 'mule', 'heels', 'heel', 'sandals', 'sandal', 'boots', 'boot', 'sneakers', 'sneaker'],
};

// Type for processed navigation
type Category = {
  href: string;
  label: string;
  subcategories: { label: string; href: string }[];
};

type QuickLink = {
  href: string;
  label: string;
  icon?: string;
  highlight?: boolean;
};

// Fallback category data
const DEFAULT_CATEGORIES: Category[] = [
  {
    href: "/men",
    label: "MEN",
    subcategories: [
      { label: "T-SHIRTS", href: "/men/tshirts" },
      { label: "SHIRTS", href: "/men/shirts" },
      { label: "JEANS", href: "/men/jeans" },
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
    ],
  },
  {
    href: "/footwear",
    label: "FOOTWEAR",
    subcategories: [
      { label: "MEN'S FOOTWEAR", href: "/footwear/men" },
      { label: "WOMEN'S FOOTWEAR", href: "/footwear/women" },
    ],
  },
];

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { href: "/lit-zone", label: "LIT ZONE", icon: "🔥", highlight: true },
  { href: "/store-locator-map", label: "STORES", icon: "📍" },
  { href: "/about", label: "ABOUT", icon: "ℹ️" },
];

// Helper to process CMS navigation data into categories and quick links
function processNavigation(items: DirectusNavigationItem[]): { categories: Category[]; quickLinks: QuickLink[] } {
  const categories: Category[] = [];
  const quickLinks: QuickLink[] = [];
  
  // First, find all parent items (parent === null)
  const parentItems = items.filter(item => item.parent === null);
  
  parentItems.forEach(parent => {
    // Check if this is a category (MEN, WOMEN, KIDS, FOOTWEAR) or a quick link
    const isCategory = ["MEN", "WOMEN", "KIDS", "FOOTWEAR"].includes(parent.label.toUpperCase());
    
    if (isCategory) {
      // Find all children for this parent
      const children = items
        .filter(item => item.parent === parent.id)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map(child => ({
          label: child.label,
          href: child.href,
        }));
      
      categories.push({
        href: parent.href,
        label: parent.label.toUpperCase(),
        subcategories: children,
      });
    } else {
      // It's a quick link
      quickLinks.push({
        href: parent.href,
        label: parent.label.toUpperCase(),
        icon: parent.icon || (parent.highlight ? "🔥" : undefined),
        highlight: parent.highlight || false,
      });
    }
  });
  
  // Sort categories by their sort order
  categories.sort((a, b) => {
    const aItem = parentItems.find(p => p.label.toUpperCase() === a.label);
    const bItem = parentItems.find(p => p.label.toUpperCase() === b.label);
    return (aItem?.sort || 0) - (bItem?.sort || 0);
  });
  
  return { categories, quickLinks };
}

export default function Header() {
  const { colors } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(DEFAULT_QUICK_LINKS);

  // Fetch navigation from CMS
  useEffect(() => {
    async function loadNavigation() {
      try {
        const [navItems, counts] = await Promise.all([fetchDirectusNavigation(), fetchProductCounts()]);

        const hasCounts = Array.isArray(counts) && counts.length > 0;

        if (navItems && navItems.length > 0) {
          const { categories: cmsCategories, quickLinks: cmsQuickLinks } = processNavigation(navItems);

          // If we have counts, filter categories and subcategories to only those with products > 0
          if (hasCounts) {
            // Build a map of gender||normalizedSub -> count (only counts > 0)
            const countsByGenderSub = new Map<string, number>();
            const availableGenders = new Set<string>();
            
            // Normalize subcategory: lowercase, remove non-alphanum
            const normalizeCmsSub = (s?: string | null) => {
              if (!s) return "";
              return s.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
            };

            counts!.forEach((c) => {
              const count = c.count || 0;
              if (count <= 0) return; // Skip subcategories with 0 products
              
              const g = (c.gender_category || "").toString().toLowerCase();
              const sub = normalizeCmsSub(c.subcategory || "");
              const key = `${g}||${sub}`;
              countsByGenderSub.set(key, (countsByGenderSub.get(key) || 0) + count);
              if (g) availableGenders.add(g);
            });

            // Helper to check if a nav subcategory has products
            const hasProducts = (gender: string, href: string) => {
              // Extract slug from href (e.g., "/men/tshirts" -> "tshirts")
              const parts = href.split('/').filter(Boolean);
              const slug = parts[parts.length - 1] || '';
              
              // Special case for footwear subcategories where slug is the gender (men/women)
              if (gender === 'footwear' && (slug === 'men' || slug === 'women')) {
                // Check if there are any footwear products for this gender
                const footwearMappings = SLUG_TO_CMS_SUBCATEGORY[slug] || ['flats', 'mules', 'heels', 'sandals', 'boots', 'sneakers'];
                return footwearMappings.some(cmsVal => {
                  const key = `${slug}||${cmsVal}`;
                  return (countsByGenderSub.get(key) || 0) > 0;
                });
              }
              
              // Get CMS subcategory mappings for this slug
              const cmsMappings = SLUG_TO_CMS_SUBCATEGORY[slug] || [normalizeCmsSub(slug)];
              
              // Check if any mapping has products for this gender
              return cmsMappings.some(cmsVal => {
                const key = `${gender}||${cmsVal}`;
                return (countsByGenderSub.get(key) || 0) > 0;
              });
            };
            
            // Helper to check if footwear category has any products
            const hasFootwearProducts = () => {
              const footwearTypes = ['flats', 'flat', 'mules', 'mule', 'heels', 'heel', 'sandals', 'sandal', 'boots', 'boot', 'sneakers', 'sneaker', 'loafers', 'loafer'];
              // Check for Men's footwear
              const hasMensFootwear = footwearTypes.some(type => (countsByGenderSub.get(`men||${type}`) || 0) > 0);
              // Check for Women's footwear
              const hasWomensFootwear = footwearTypes.some(type => (countsByGenderSub.get(`women||${type}`) || 0) > 0);
              return hasMensFootwear || hasWomensFootwear;
            };

            const filteredCats = cmsCategories
              .map((cat) => {
                const catGender = cat.label.toString().toLowerCase();
                
                // Special handling for Footwear category
                if (catGender === 'footwear') {
                  if (!hasFootwearProducts()) return null;
                  
                  // Filter footwear subcategories based on gender-specific footwear products
                  const subcats = (cat.subcategories || []).filter((s) => {
                    return hasProducts('footwear', s.href);
                  });
                  
                  return {
                    ...cat,
                    subcategories: subcats,
                  };
                }
                
                // Check if this gender has any products at all
                if (!availableGenders.has(catGender)) return null;
                
                // Filter subcategories: only include if gender-specific count > 0
                const subcats = (cat.subcategories || []).filter((s) => {
                  return hasProducts(catGender, s.href);
                });

                // Include category even if no subcategories match (category has products)
                return {
                  ...cat,
                  subcategories: subcats,
                };
              })
              .filter(Boolean) as typeof cmsCategories;

            // Ensure Footwear category is always included if it has products
            const hasFootwearInFiltered = filteredCats.some(cat => cat.label.toLowerCase() === 'footwear');
            let finalCategories = filteredCats;
            
            if (!hasFootwearInFiltered && hasFootwearProducts()) {
              // Get Footwear from defaults and filter its subcategories
              const defaultFootwear = DEFAULT_CATEGORIES.find(cat => cat.label === 'FOOTWEAR');
              if (defaultFootwear) {
                const footwearWithFilteredSubs = {
                  ...defaultFootwear,
                  subcategories: (defaultFootwear.subcategories || []).filter((s) => {
                    return hasProducts('footwear', s.href);
                  }),
                };
                finalCategories = [...filteredCats, footwearWithFilteredSubs];
              }
            }

            if (finalCategories.length > 0) setCategories(finalCategories);
            else setCategories(cmsCategories);
          } else {
            // No product counts available - use CMS categories but ensure Footwear is included
            if (cmsCategories.length > 0) {
              const hasFootwearInCms = cmsCategories.some(cat => cat.label.toLowerCase() === 'footwear');
              if (!hasFootwearInCms) {
                const defaultFootwear = DEFAULT_CATEGORIES.find(cat => cat.label === 'FOOTWEAR');
                if (defaultFootwear) {
                  setCategories([...cmsCategories, defaultFootwear]);
                } else {
                  setCategories(cmsCategories);
                }
              } else {
                setCategories(cmsCategories);
              }
            }
          }

          if (cmsQuickLinks.length > 0) {
            // Add default icons to quick links if missing
            const enrichedQuickLinks = cmsQuickLinks.map(link => ({
              ...link,
              icon: link.icon || getDefaultIcon(link.label),
            }));
            setQuickLinks(enrichedQuickLinks);
          }
        }
      } catch (error) {
        console.error("Failed to load navigation from CMS:", error);
        // Keep defaults on error
      }
    }
    loadNavigation();
  }, []);

  // Helper to get default icon for quick links
  function getDefaultIcon(label: string): string {
    const iconMap: Record<string, string> = {
      "LIT ZONE": "🔥",
      "STORES": "📍",
      "ABOUT": "ℹ️",
      "CONTACT": "📧",
    };
    return iconMap[label.toUpperCase()] || "•";
  }

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
                {categories.map((category) => (
                  <div 
                    key={category.href}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(category.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link 
                      href={category.href} 
                      className="group flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-white/5 transition-all duration-300"
                    >
                      <span className="text-xs font-bold tracking-[0.12em] uppercase text-white/90 group-hover:text-white transition-colors duration-300">
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
                {quickLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg hover:bg-white/5 text-sm font-bold tracking-wider uppercase text-white/90 hover:text-white transition-all duration-300 ${link.highlight ? 'icon-fire-container' : ''}`}
                  >
                    {link.icon && <span className="text-base">{link.icon}</span>}
                    <span className="relative">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#C83232] to-[#e63946] transition-all duration-300" style={{ width: '0%' }}></span>
                    </span>
                  </Link>
                ))}
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
            {categories.map((category) => (
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
            {quickLinks.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center gap-3 py-3 px-4 text-white/80 font-medium tracking-wide hover:bg-white/5 rounded-lg transition-all duration-300"
              >
                {item.icon && <span className="text-lg group-hover:scale-125 transition-transform duration-300">{item.icon}</span>}
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
