// src/components/v2/StoreLocator.tsx
"use client";
import Link from "next/link";

/**
 * StoreLocatorV2 - Bold Store Locator Section
 * Highlights physical stores - core feature of ZECODE website
 */

const FEATURED_CITIES = [
  { name: "MUMBAI", stores: 12 },
  { name: "DELHI", stores: 8 },
  { name: "BANGALORE", stores: 6 },
  { name: "HYDERABAD", stores: 5 },
  { name: "CHENNAI", stores: 4 },
  { name: "PUNE", stores: 4 },
  { name: "KOLKATA", stores: 3 },
  { name: "AHMEDABAD", stores: 3 },
];

export default function StoreLocator() {
  return (
    <section className="relative bg-gradient-to-br from-[#C83232] via-[#a82828] to-[#8a2020] py-20 md:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div>
            <span className="text-xs tracking-[0.4em] uppercase text-white/60 font-semibold mb-3 block">
              VISIT US
            </span>
            <h2 
              className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tight mb-6"
              style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
            >
              FIND A STORE
              <br />
              NEAR YOU
            </h2>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-lg leading-relaxed">
              Experience ZECODE fashion in person. Visit any of our <span className="text-white font-bold">50+ stores</span> across India for the latest collections, exclusive styles, and personalized service.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/store-locator-map"
                className="group inline-flex items-center justify-center gap-3 bg-white text-[#C83232] px-8 py-5 text-sm md:text-base font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                VIEW ALL STORES
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right - City Grid */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURED_CITIES.map((city, index) => (
              <Link
                key={city.name}
                href={`/store-locator-map?city=${city.name.toLowerCase()}`}
                className="group relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <h3 
                  className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight"
                  style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
                >
                  {city.name}
                </h3>
                <p className="text-white/50 text-sm">
                  {city.stores} {city.stores === 1 ? 'Store' : 'Stores'}
                </p>

                {/* Hover Arrow */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}

            {/* View All Card */}
            <Link
              href="/store-locator-map"
              className="group col-span-2 relative p-6 bg-black/20 backdrop-blur-sm border border-white/20 hover:border-white hover:bg-black/40 transition-all duration-300 flex items-center justify-between"
            >
              <div>
                <h3 
                  className="text-2xl md:text-3xl font-black text-white tracking-tight"
                  style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}
                >
                  VIEW ALL 50+ STORES
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  Find the nearest ZECODE store
                </p>
              </div>
              <div className="w-12 h-12 border border-white/30 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-300">
                <svg className="w-5 h-5 text-white group-hover:text-[#C83232] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 text-[25vw] font-black text-white/5 leading-none select-none pointer-events-none" style={{ fontFamily: '"DIN Condensed", Impact, sans-serif' }}>
        50+
      </div>
    </section>
  );
}
