// src/components/v2/SubcategoryGrid.tsx
"use client";
import Link from "next/link";
import Image from "next/image";

/**
 * SubcategoryGridV2 - Bold Subcategory Display
 * Displays subcategories (T-Shirts, Shirts, Jeans, etc.) with enhanced visuals
 */

interface SubcategoryGridProps {
  category: "men" | "women" | "kids";
}

const SUBCATEGORIES = {
  men: [
    { label: "T-SHIRTS", href: "/men/tshirts", image: "/products/men-tshirt.jpg" },
    { label: "SHIRTS", href: "/men/shirts", image: "/products/men-shirt.jpg" },
    { label: "JEANS", href: "/men/jeans", image: "/products/men-jeans.jpg" },
    { label: "TROUSERS", href: "/men/trousers", image: "/products/men-trousers.jpg" },
    { label: "JACKETS", href: "/men/jackets", image: "/products/men-jacket.jpg" },
    { label: "SHOES", href: "/men/shoes", image: "/products/men-shoes.jpg" },
  ],
  women: [
    { label: "TOPS", href: "/women/tops", image: "/products/women-top.jpg" },
    { label: "DRESSES", href: "/women/dresses", image: "/products/women-dress.jpg" },
    { label: "JEANS", href: "/women/jeans", image: "/products/women-jeans.jpg" },
    { label: "SKIRTS", href: "/women/skirts", image: "/products/women-skirt.jpg" },
    { label: "JACKETS", href: "/women/jackets", image: "/products/women-jacket.jpg" },
    { label: "SHOES", href: "/women/shoes", image: "/products/women-shoes.jpg" },
  ],
  kids: [
    { label: "BOYS T-SHIRTS", href: "/kids/boys-tshirts", image: "/products/kids-boys-tshirt.jpg" },
    { label: "GIRLS TOPS", href: "/kids/girls-tops", image: "/products/kids-girls-top.jpg" },
    { label: "BOYS JEANS", href: "/kids/boys-jeans", image: "/products/kids-boys-jeans.jpg" },
    { label: "GIRLS DRESSES", href: "/kids/girls-dresses", image: "/products/kids-girls-dress.jpg" },
    { label: "JACKETS", href: "/kids/jackets", image: "/products/kids-jacket.jpg" },
    { label: "SHOES", href: "/kids/shoes", image: "/products/kids-shoes.jpg" },
  ],
};

const CATEGORY_TITLES = {
  men: "MEN'S COLLECTION",
  women: "WOMEN'S COLLECTION",
  kids: "KIDS COLLECTION",
};

export default function SubcategoryGrid({ category }: SubcategoryGridProps) {
  const subcategories = SUBCATEGORIES[category];
  const title = CATEGORY_TITLES[category];

  return (
    <section className="relative bg-black py-20 md:py-32 overflow-hidden">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 mb-12 md:mb-16">
        <div className="text-center">
          <span className="text-xs tracking-[0.4em] uppercase text-[#C83232] font-semibold mb-3 block">
            BROWSE STYLES
          </span>
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight"
            style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Subcategory Grid */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {subcategories.map((subcat, index) => (
            <Link
              key={subcat.href}
              href={subcat.href}
              className="group relative aspect-square overflow-hidden"
              style={{
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {/* Background Image */}
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                <Image
                  src={subcat.image}
                  alt={subcat.label}
                  fill
                  className="object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-500" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                {/* Label */}
                <h3 
                  className="text-xl md:text-2xl lg:text-3xl font-black text-white text-center tracking-tight group-hover:scale-110 transition-transform duration-500"
                  style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
                >
                  {subcat.label}
                </h3>

                {/* Hover CTA */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <span className="inline-flex items-center gap-2 text-[#C83232] text-xs font-bold tracking-[0.15em] uppercase">
                    EXPLORE
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>

                {/* Border Effect */}
                <div className="absolute inset-2 border border-white/0 group-hover:border-white/20 transition-colors duration-500" />
              </div>

              {/* Corner Accents */}
              <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-white/0 group-hover:border-[#C83232] transition-colors duration-500" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-white/0 group-hover:border-[#C83232] transition-colors duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
