// src/components/v2/BrandStory.tsx
"use client";
import Link from "next/link";
import Image from "next/image";

/**
 * BrandStoryV2 - Bold About Section
 * Highlights ZECODE brand story with enhanced visuals
 */

export default function BrandStory() {
  return (
    <section className="relative bg-black py-20 md:py-32 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Image */}
          <div className="relative aspect-[4/5] md:aspect-[3/4]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C83232]/20 to-transparent z-10" />
            <Image
              src="/brand/about-hero.jpg"
              alt="ZECODE Brand"
              fill
              className="object-cover"
            />
            {/* Overlay Text */}
            <div className="absolute bottom-8 left-8 right-8 z-20">
              <span 
                className="text-7xl md:text-9xl font-black text-white/10 tracking-tight"
                style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
              >
                SINCE
                <br />
                2015
              </span>
            </div>
            {/* Border Accent */}
            <div className="absolute inset-4 border border-white/10" />
          </div>

          {/* Right - Content */}
          <div>
            <span className="text-xs tracking-[0.4em] uppercase text-[#C83232] font-semibold mb-3 block">
              OUR STORY
            </span>
            <h2 
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-8"
              style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
            >
              THE FASHION
              <br />
              <span className="text-[#C83232]">CODE</span>
            </h2>
            
            <div className="space-y-6 text-white/70 text-lg leading-relaxed mb-10">
              <p>
                <span className="text-white font-semibold">ZECODE</span> isn&apos;t just a brand—it&apos;s a statement. Born from the belief that fashion should be bold, accessible, and unapologetically expressive.
              </p>
              <p>
                With <span className="text-white font-semibold">50+ stores</span> across India, we&apos;ve built a community of fashion-forward individuals who dare to stand out. Our collections blend contemporary trends with timeless style.
              </p>
              <p>
                From premium fabrics to cutting-edge designs, every piece is crafted for those who refuse to blend in.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="border-l-2 border-[#C83232] pl-4">
                <span 
                  className="text-3xl md:text-4xl font-black text-white"
                  style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
                >
                  50+
                </span>
                <p className="text-white/50 text-sm uppercase tracking-wider mt-1">Stores</p>
              </div>
              <div className="border-l-2 border-[#C83232] pl-4">
                <span 
                  className="text-3xl md:text-4xl font-black text-white"
                  style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
                >
                  600+
                </span>
                <p className="text-white/50 text-sm uppercase tracking-wider mt-1">Products</p>
              </div>
              <div className="border-l-2 border-[#C83232] pl-4">
                <span 
                  className="text-3xl md:text-4xl font-black text-white"
                  style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
                >
                  1M+
                </span>
                <p className="text-white/50 text-sm uppercase tracking-wider mt-1">Happy Customers</p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/about"
              className="group inline-flex items-center gap-4 text-white hover:text-[#C83232] transition-colors duration-300"
            >
              <span className="text-sm font-bold tracking-[0.15em] uppercase">LEARN MORE ABOUT US</span>
              <span className="w-12 h-12 border border-white/30 group-hover:border-[#C83232] group-hover:bg-[#C83232] flex items-center justify-center transition-all duration-300">
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Background Accent Lines */}
      <div className="absolute top-0 right-20 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
      <div className="absolute top-0 right-40 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
    </section>
  );
}
