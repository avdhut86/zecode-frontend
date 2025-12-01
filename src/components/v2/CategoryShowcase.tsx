// src/components/v2/CategoryShowcase.tsx
"use client";
import Link from "next/link";
import Image from "next/image";

/**
 * CategoryShowcaseV2 - Bold Category Grid
 * Displays MEN, WOMEN, KIDS categories with enhanced visual effects
 */

const CATEGORIES = [
  {
    id: 1,
    label: "MEN",
    href: "/men",
    image: "/categories/men.jpg",
    description: "Bold styles for confident men",
    count: "200+ Products",
  },
  {
    id: 2,
    label: "WOMEN",
    href: "/women",
    image: "/categories/women.jpg",
    description: "Elegant fashion for fierce women",
    count: "250+ Products",
  },
  {
    id: 3,
    label: "KIDS",
    href: "/kids",
    image: "/categories/kids.jpg",
    description: "Trendy looks for little ones",
    count: "150+ Products",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="relative bg-black py-20 md:py-32 overflow-hidden">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 mb-12 md:mb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-xs tracking-[0.4em] uppercase text-[#C83232] font-semibold mb-3 block">
              SHOP BY CATEGORY
            </span>
            <h2 
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight"
              style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
            >
              EXPLORE COLLECTIONS
            </h2>
          </div>
          <Link 
            href="/store-locator-map" 
            className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300"
          >
            <span className="text-sm font-semibold tracking-wider uppercase">FIND A STORE</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Category Grid */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {CATEGORIES.map((category, index) => (
            <Link
              key={category.id}
              href={category.href}
              className="group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Background Image */}
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  className="object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-10">
                {/* Category Badge */}
                <span className="inline-block self-start px-3 py-1 bg-white/10 backdrop-blur-sm text-white/70 text-xs tracking-widest uppercase mb-4 border border-white/10">
                  {category.count}
                </span>

                {/* Title */}
                <h3 
                  className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight group-hover:translate-x-2 transition-transform duration-500"
                  style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
                >
                  {category.label}
                </h3>

                {/* Description */}
                <p className="text-white/60 text-sm md:text-base mb-6 max-w-xs">
                  {category.description}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-3 text-[#C83232] group-hover:gap-5 transition-all duration-300">
                  <span className="text-sm font-bold tracking-[0.15em] uppercase">SHOP NOW</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#C83232] transition-colors duration-500" />
              </div>

              {/* Corner Accent */}
              <div className="absolute top-0 right-0 w-16 h-16">
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/20 group-hover:border-[#C83232] group-hover:w-12 group-hover:h-12 group-hover:top-2 group-hover:right-2 transition-all duration-500" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Background Accent */}
      <div className="absolute top-1/2 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-[#C83232] to-transparent opacity-50" />
      <div className="absolute top-1/2 right-0 w-1 h-32 bg-gradient-to-b from-transparent via-[#C83232] to-transparent opacity-50" />
    </section>
  );
}
