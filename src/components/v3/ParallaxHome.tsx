'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// V3 UNIQUE COLOR PALETTE - Warm, Earthy Tones (Different from V1/V2 dark+red)
const V3_COLORS = {
  background: '#F5F1ED',      // Warm Ivory
  backgroundDark: '#E8E2DB',  // Darker Ivory
  text: '#2D2926',            // Dark Brown/Charcoal
  textLight: '#6B635B',       // Muted Brown
  accent: '#C4704C',          // Terracotta
  accentHover: '#A85A3A',     // Darker Terracotta
  accentLight: '#E8B89A',     // Light Terracotta
  highlight: '#8B7355',       // Warm Taupe
};

// Parallax Hook with SSR safety
const useParallax = (speed: number = 0.5) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.scrollY;
        const elementTop = rect.top + scrolled;
        const relativeScroll = scrolled - elementTop + window.innerHeight;
        setOffset(relativeScroll * speed);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
};

// ========== HERO SECTION ==========
const HeroSection: React.FC = () => {
  const { ref, offset } = useParallax(0.3);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section 
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: V3_COLORS.background }}
    >
      {/* Floating decorative elements */}
      <div 
        className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20 transition-transform duration-700"
        style={{ 
          backgroundColor: V3_COLORS.accentLight,
          transform: mounted ? `translateY(${offset * 0.5}px)` : 'translateY(0px)'
        }}
      />
      <div 
        className="absolute top-40 right-20 w-48 h-48 rounded-full opacity-15 transition-transform duration-700"
        style={{ 
          backgroundColor: V3_COLORS.accent,
          transform: mounted ? `translateY(${offset * 0.3}px)` : 'translateY(0px)'
        }}
      />
      <div 
        className="absolute bottom-40 left-1/4 w-24 h-24 rounded-full opacity-25 transition-transform duration-700"
        style={{ 
          backgroundColor: V3_COLORS.highlight,
          transform: mounted ? `translateY(${-offset * 0.4}px)` : 'translateY(0px)'
        }}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <h1 
          className="text-6xl md:text-8xl font-light mb-6 tracking-wider"
          style={{ 
            color: V3_COLORS.text,
            transform: mounted ? `translateY(${offset * 0.2}px)` : 'translateY(0px)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          ZECODE
        </h1>
        <p 
          className="text-xl md:text-2xl mb-8 font-light"
          style={{ 
            color: V3_COLORS.textLight,
            transform: mounted ? `translateY(${offset * 0.15}px)` : 'translateY(0px)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          Curated Fashion for Every Story
        </p>
        <Link
          href="/collections"
          className="inline-block px-12 py-4 text-sm tracking-widest uppercase font-medium transition-all duration-300 hover:scale-105"
          style={{ 
            backgroundColor: V3_COLORS.accent,
            color: V3_COLORS.background
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = V3_COLORS.accentHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = V3_COLORS.accent}
        >
          Explore Collection
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke={V3_COLORS.textLight}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

// ========== OFFER SECTION ==========
const OfferSection: React.FC = () => {
  const { ref, offset } = useParallax(0.4);
  const [windowHeight, setWindowHeight] = useState(800); // Default for SSR

  useEffect(() => {
    // Set actual window height on client
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section 
      ref={ref}
      className="relative py-32 overflow-hidden"
      style={{ 
        backgroundColor: V3_COLORS.accent,
        minHeight: windowHeight * 0.6
      }}
    >
      {/* Floating shapes */}
      <div 
        className="absolute top-10 right-10 w-40 h-40 border-2 rounded-full opacity-30"
        style={{ 
          borderColor: V3_COLORS.background,
          transform: `translateY(${offset * 0.3}px) rotate(${offset * 0.1}deg)`
        }}
      />
      <div 
        className="absolute bottom-20 left-10 w-32 h-32 border-2 opacity-20"
        style={{ 
          borderColor: V3_COLORS.background,
          transform: `translateY(${-offset * 0.2}px) rotate(${-offset * 0.05}deg)`
        }}
      />

      <div className="container mx-auto px-4 text-center relative z-10">
        <span 
          className="text-sm tracking-widest uppercase mb-4 block"
          style={{ color: V3_COLORS.accentLight }}
        >
          Limited Time Offer
        </span>
        <h2 
          className="text-5xl md:text-7xl font-light mb-6"
          style={{ 
            color: V3_COLORS.background,
            transform: `translateY(${offset * 0.15}px)`
          }}
        >
          30% OFF
        </h2>
        <p 
          className="text-xl mb-8 max-w-2xl mx-auto"
          style={{ color: V3_COLORS.backgroundDark }}
        >
          Discover our summer collection with exclusive savings. Elegance meets comfort in every piece.
        </p>
        <Link
          href="/sale"
          className="inline-block px-10 py-3 text-sm tracking-widest uppercase font-medium transition-all duration-300 border-2 hover:scale-105"
          style={{ 
            borderColor: V3_COLORS.background,
            color: V3_COLORS.background
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = V3_COLORS.background;
            e.currentTarget.style.color = V3_COLORS.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = V3_COLORS.background;
          }}
        >
          Shop Sale
        </Link>
      </div>
    </section>
  );
};

// ========== CATEGORY SECTION ==========
interface CategorySectionProps {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  reverse?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, subtitle, image, link, reverse }) => {
  const { ref, offset } = useParallax(0.25);
  const [windowHeight, setWindowHeight] = useState(800); // Default for SSR

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section 
      ref={ref}
      className="relative overflow-hidden"
      style={{ 
        backgroundColor: V3_COLORS.background,
        minHeight: windowHeight * 0.8
      }}
    >
      <div className={`container mx-auto px-4 py-20 flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
        {/* Image */}
        <div 
          className="w-full md:w-1/2 relative aspect-[3/4] overflow-hidden"
          style={{ transform: `translateY(${offset * 0.1}px)` }}
        >
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: V3_COLORS.backgroundDark,
              transform: `translateY(${-offset * 0.15}px)`
            }}
          >
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          {/* Decorative frame */}
          <div 
            className="absolute -bottom-4 -right-4 w-full h-full border-2 -z-10"
            style={{ 
              borderColor: V3_COLORS.accent,
              transform: `translateY(${offset * 0.05}px)`
            }}
          />
        </div>

        {/* Content */}
        <div 
          className="w-full md:w-1/2 text-center md:text-left"
          style={{ transform: `translateY(${-offset * 0.1}px)` }}
        >
          <span 
            className="text-sm tracking-widest uppercase mb-4 block"
            style={{ color: V3_COLORS.accent }}
          >
            Collection
          </span>
          <h2 
            className="text-4xl md:text-6xl font-light mb-6"
            style={{ color: V3_COLORS.text }}
          >
            {title}
          </h2>
          <p 
            className="text-lg mb-8 max-w-md"
            style={{ color: V3_COLORS.textLight }}
          >
            {subtitle}
          </p>
          <Link
            href={link}
            className="inline-flex items-center gap-3 text-sm tracking-widest uppercase font-medium transition-all duration-300 group"
            style={{ color: V3_COLORS.accent }}
          >
            <span>View Collection</span>
            <svg 
              className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" 
              fill="none" 
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

// ========== MAIN COMPONENT ==========
const ParallaxHome: React.FC = () => {
  return (
    <main style={{ backgroundColor: V3_COLORS.background }}>
      <HeroSection />
      
      <OfferSection />
      
      <CategorySection
        title="Men's Collection"
        subtitle="Refined essentials and contemporary pieces designed for the modern gentleman. From tailored fits to casual comfort."
        image="/categories/men-category.jpg"
        link="/category/men"
      />
      
      <CategorySection
        title="Women's Collection"
        subtitle="Elegance redefined with timeless silhouettes and modern designs. Discover pieces that celebrate every occasion."
        image="/categories/women-category.jpg"
        link="/category/women"
        reverse
      />
      
      <CategorySection
        title="Kids' Collection"
        subtitle="Playful styles with comfort at heart. Clothing that moves with them through every adventure."
        image="/categories/kids-category.jpg"
        link="/category/kids"
      />

      {/* Newsletter section with parallax */}
      <section 
        className="relative py-32 overflow-hidden"
        style={{ backgroundColor: V3_COLORS.backgroundDark }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 
            className="text-3xl md:text-5xl font-light mb-6"
            style={{ color: V3_COLORS.text }}
          >
            Stay Connected
          </h2>
          <p 
            className="text-lg mb-8 max-w-2xl mx-auto"
            style={{ color: V3_COLORS.textLight }}
          >
            Subscribe to receive updates on new arrivals, exclusive offers, and styling inspiration.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 text-sm focus:outline-none transition-all duration-300"
              style={{ 
                backgroundColor: V3_COLORS.background,
                color: V3_COLORS.text,
                border: `1px solid ${V3_COLORS.highlight}`
              }}
            />
            <button
              type="submit"
              className="px-8 py-4 text-sm tracking-widest uppercase font-medium transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: V3_COLORS.accent,
                color: V3_COLORS.background
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = V3_COLORS.accentHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = V3_COLORS.accent}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default ParallaxHome;
