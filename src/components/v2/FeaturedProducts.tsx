// src/components/v2/FeaturedProducts.tsx
"use client";
import Link from "next/link";
import Image from "next/image";

/**
 * FeaturedProductsV2 - Bold Product Showcase
 * Displays featured products with enhanced visuals - catalogue only, no cart
 */

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  href: string;
  isNew?: boolean;
}

const FEATURED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "PREMIUM COTTON TEE",
    category: "MEN",
    price: "₹1,299",
    image: "/products/featured-1.jpg",
    href: "/men/tshirts",
    isNew: true,
  },
  {
    id: 2,
    name: "SLIM FIT DENIM",
    category: "MEN",
    price: "₹2,499",
    image: "/products/featured-2.jpg",
    href: "/men/jeans",
  },
  {
    id: 3,
    name: "FLORAL SUMMER DRESS",
    category: "WOMEN",
    price: "₹2,199",
    image: "/products/featured-3.jpg",
    href: "/women/dresses",
    isNew: true,
  },
  {
    id: 4,
    name: "CASUAL BOMBER JACKET",
    category: "WOMEN",
    price: "₹3,499",
    image: "/products/featured-4.jpg",
    href: "/women/jackets",
  },
];

export default function FeaturedProducts() {
  return (
    <section className="relative bg-[#0a0a0a] py-20 md:py-32 overflow-hidden">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 mb-12 md:mb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-xs tracking-[0.4em] uppercase text-[#C83232] font-semibold mb-3 block">
              TRENDING NOW
            </span>
            <h2 
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight"
              style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
            >
              FEATURED STYLES
            </h2>
          </div>
          <Link 
            href="/store-locator-map" 
            className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300"
          >
            <span className="text-sm font-semibold tracking-wider uppercase">VIEW IN STORE</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURED_PRODUCTS.map((product, index) => (
            <Link
              key={product.id}
              href={product.href}
              className="group relative"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Product Image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 mb-4">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                {/* New Badge */}
                {product.isNew && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-[#C83232] text-white text-xs font-bold tracking-wider">
                    NEW
                  </span>
                )}

                {/* Quick View Button */}
                <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <span className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black text-xs font-bold tracking-wider uppercase hover:bg-[#C83232] hover:text-white transition-colors duration-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    FIND IN STORE
                  </span>
                </div>

                {/* Border Effect */}
                <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-300" />
              </div>

              {/* Product Info */}
              <div>
                <span className="text-xs text-[#C83232] tracking-wider uppercase mb-1 block">
                  {product.category}
                </span>
                <h3 className="text-sm md:text-base font-bold text-white group-hover:text-[#C83232] transition-colors duration-300 mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-white/60 text-sm font-semibold">
                  {product.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* View All CTA */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 mt-12 md:mt-16 text-center">
        <Link
          href="/store-locator-map"
          className="group inline-flex items-center gap-4 border border-white/20 hover:border-[#C83232] hover:bg-[#C83232] px-8 py-4 transition-all duration-300"
        >
          <span className="text-white text-sm font-bold tracking-[0.15em] uppercase">
            VISIT A STORE TO SEE ALL
          </span>
          <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* Background Accents */}
      <div className="absolute top-20 left-0 w-32 h-32 bg-[#C83232]/5 blur-3xl" />
      <div className="absolute bottom-20 right-0 w-48 h-48 bg-[#C83232]/5 blur-3xl" />
    </section>
  );
}
