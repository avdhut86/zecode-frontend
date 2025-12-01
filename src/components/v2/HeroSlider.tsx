// src/components/v2/HeroSlider.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * HeroSliderV2 - Bold Hero Slider with Dynamic Animations
 * Navy Blue & Gold Color Scheme
 */

// V2 Color Palette - Navy & Gold
const V2_COLORS = {
  primary: '#1a2744',
  primaryLight: '#2a3a5c',
  secondary: '#c9a227',
  secondaryLight: '#dbb44a',
  text: '#ffffff',
  textMuted: '#a8b2c4',
  accent: '#e8b923',
};

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: string;
  ctaLink: string;
  textColor: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    title: "THE FASHION CODE",
    subtitle: "NEW COLLECTION 2025",
    description: "Express your unique style with our latest collection",
    image: "/placeholders/slide1.jpg",
    cta: "FIND A STORE NEAR YOU",
    ctaLink: "/store-locator-map",
    textColor: "#ffffff",
  },
  {
    id: 2,
    title: "MEN'S COLLECTION",
    subtitle: "BOLD & CONFIDENT",
    description: "Discover styles crafted for the modern man",
    image: "/placeholders/slide2.jpg",
    cta: "SHOP MEN",
    ctaLink: "/men",
    textColor: "#ffffff",
  },
  {
    id: 3,
    title: "WOMEN'S COLLECTION",
    subtitle: "ELEGANT & FIERCE",
    description: "Fashion that empowers and inspires",
    image: "/placeholders/slide3.jpg",
    cta: "SHOP WOMEN",
    ctaLink: "/women",
    textColor: "#ffffff",
  },
  {
    id: 4,
    title: "KIDS COLLECTION",
    subtitle: "FUN & TRENDY",
    description: "Let the little ones express their style",
    image: "/placeholders/slide4.jpg",
    cta: "SHOP KIDS",
    ctaLink: "/kids",
    textColor: "#ffffff",
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const slides = DEFAULT_SLIDES;

  const goToSlide = useCallback((index: number, dir: 'next' | 'prev' = 'next') => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setDirection(dir);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 800);
  }, [isAnimating, currentSlide]);

  const nextSlide = useCallback(() => {
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next, 'next');
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    goToSlide(prev, 'prev');
  }, [currentSlide, slides.length, goToSlide]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="relative h-[100vh] min-h-[700px] overflow-hidden" style={{ backgroundColor: V2_COLORS.primary }}>
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-[800ms] ease-out ${
            index === currentSlide
              ? 'opacity-100 z-10'
              : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className={`absolute inset-0 transition-transform duration-[1200ms] ease-out ${
            index === currentSlide ? 'scale-100' : 'scale-110'
          }`}>
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover"
            />
            {/* Navy Overlay */}
            <div 
              className="absolute inset-0" 
              style={{ background: `linear-gradient(to right, ${V2_COLORS.primary}cc, ${V2_COLORS.primary}66, transparent)` }}
            />
            <div 
              className="absolute inset-0" 
              style={{ background: `linear-gradient(to top, ${V2_COLORS.primary}99, transparent, ${V2_COLORS.primary}4d)` }}
            />
          </div>

          {/* Content */}
          <div className="relative z-20 h-full flex items-center">
            <div className="max-w-[1600px] mx-auto px-6 md:px-16 w-full">
              <div className="max-w-3xl">
                {/* Subtitle */}
                <div className={`overflow-hidden transition-all duration-700 delay-100 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}>
                  <span 
                    className={`inline-block text-xs md:text-sm tracking-[0.4em] uppercase font-semibold mb-4 ${
                      index === currentSlide ? 'translate-y-0' : direction === 'next' ? 'translate-y-full' : '-translate-y-full'
                    } transition-transform duration-700 delay-200`}
                    style={{ color: V2_COLORS.secondary }}
                  >
                    {slide.subtitle}
                  </span>
                </div>

                {/* Title */}
                <div className="overflow-hidden mb-6">
                  <h1 
                    className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight ${
                      index === currentSlide ? 'translate-y-0 opacity-100' : direction === 'next' ? 'translate-y-full opacity-0' : '-translate-y-full opacity-0'
                    } transition-all duration-700 delay-300`}
                    style={{ 
                      color: slide.textColor,
                      fontFamily: '"DIN Condensed", Impact, sans-serif',
                      textShadow: '0 4px 30px rgba(0,0,0,0.5)'
                    }}
                  >
                    {slide.title}
                  </h1>
                </div>

                {/* Description */}
                <div className="overflow-hidden mb-10">
                  <p 
                    className={`text-lg md:text-xl max-w-lg ${
                      index === currentSlide ? 'translate-y-0 opacity-100' : direction === 'next' ? 'translate-y-full opacity-0' : '-translate-y-full opacity-0'
                    } transition-all duration-700 delay-400`}
                    style={{ color: V2_COLORS.textMuted }}
                  >
                    {slide.description}
                  </p>
                </div>

                {/* CTA Button */}
                <div className={`${
                  index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } transition-all duration-700 delay-500`}>
                  <Link
                    href={slide.ctaLink}
                    className="group relative inline-flex items-center gap-4 text-sm md:text-base font-bold tracking-[0.15em] uppercase overflow-hidden transition-all duration-300 px-8 py-5"
                    style={{ 
                      backgroundColor: V2_COLORS.secondary,
                      color: V2_COLORS.primary
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = V2_COLORS.accent}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = V2_COLORS.secondary}
                  >
                    <span className="relative z-10">{slide.cta}</span>
                    <svg className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <div className="absolute left-6 right-6 md:left-16 md:right-16 top-1/2 -translate-y-1/2 z-30 flex justify-between pointer-events-none">
        <button
          onClick={prevSlide}
          className="pointer-events-auto group w-14 h-14 md:w-16 md:h-16 flex items-center justify-center backdrop-blur-sm transition-all duration-300"
          style={{ 
            border: `1px solid ${V2_COLORS.secondary}40`,
            backgroundColor: `${V2_COLORS.primary}33`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = V2_COLORS.secondary;
            e.currentTarget.style.backgroundColor = V2_COLORS.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${V2_COLORS.secondary}40`;
            e.currentTarget.style.backgroundColor = `${V2_COLORS.primary}33`;
          }}
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="pointer-events-auto group w-14 h-14 md:w-16 md:h-16 flex items-center justify-center backdrop-blur-sm transition-all duration-300"
          style={{ 
            border: `1px solid ${V2_COLORS.secondary}40`,
            backgroundColor: `${V2_COLORS.primary}33`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = V2_COLORS.secondary;
            e.currentTarget.style.backgroundColor = V2_COLORS.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${V2_COLORS.secondary}40`;
            e.currentTarget.style.backgroundColor = `${V2_COLORS.primary}33`;
          }}
          aria-label="Next slide"
        >
          <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index, index > currentSlide ? 'next' : 'prev')}
            className="relative h-1 transition-all duration-500"
            style={{ 
              width: index === currentSlide ? '4rem' : '2rem',
              backgroundColor: index === currentSlide ? V2_COLORS.secondary : `${V2_COLORS.text}4d`
            }}
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === currentSlide && (
              <span 
                className="absolute inset-0 animate-[slideProgress_6s_linear_infinite]"
                style={{ backgroundColor: `${V2_COLORS.text}4d` }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-bounce">
        <svg className="w-6 h-6" style={{ color: `${V2_COLORS.text}66` }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-12 right-6 md:right-16 z-30 flex items-baseline gap-1 font-mono" style={{ color: V2_COLORS.textMuted }}>
        <span className="text-3xl md:text-4xl font-bold" style={{ color: V2_COLORS.text }}>{String(currentSlide + 1).padStart(2, '0')}</span>
        <span className="text-lg">/</span>
        <span className="text-lg">{String(slides.length).padStart(2, '0')}</span>
      </div>
    </section>
  );
}
