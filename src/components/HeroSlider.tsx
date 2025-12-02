// src/components/HeroSlider.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type HeroSlide, fileUrl } from "@/lib/directus";

/**
 * Hero Slider featuring main offers and category promotions
 * Each slide showcases a category (Men, Women, Kids) or special offers
 */

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 1,
    image: "/hero/hero1.png",
    title: "YOUR NEW FASHION CODE",
    subtitle: "Discover Urban Fashion at 50+ Stores Across India",
    cta: "FIND A STORE NEAR YOU",
    link: "/store-locator-map",
  },
  {
    id: 2,
    image: "/categories/men.jpg",
    title: "MEN'S COLLECTION",
    subtitle: "Bold Streetwear • Casual Essentials • Urban Edge",
    cta: "SHOP MEN",
    link: "/men",
  },
  {
    id: 3,
    image: "/categories/women.jpg",
    title: "WOMEN'S COLLECTION",
    subtitle: "Trendy Styles • Effortless Fashion • Express Yourself",
    cta: "SHOP WOMEN",
    link: "/women",
  },
  {
    id: 4,
    image: "/categories/kids.jpg",
    title: "KIDS' COLLECTION",
    subtitle: "Fun & Stylish • Comfortable Fits • Made for Play",
    cta: "SHOP KIDS",
    link: "/kids",
  },
  {
    id: 5,
    image: "/categories/footwear.jpg",
    title: "FOOTWEAR COLLECTION",
    subtitle: "Step Up Your Style • Comfort Meets Fashion • Walk With Confidence",
    cta: "SHOP FOOTWEAR",
    link: "/footwear",
  },
];

interface HeroSliderProps {
  slides?: HeroSlide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  // Normalize slides to handle both old format and CMS format
  const baseSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;

  // Ensure Footwear slide is always included
  const footwearSlide = DEFAULT_SLIDES.find(s => s.link === '/footwear');
  const hasFootwearSlide = baseSlides.some(s => s.link === '/footwear' || (s as any).cta_link === '/footwear');

  const slidesWithFootwear = hasFootwearSlide ? baseSlides : [...baseSlides, footwearSlide!];

  const normalizedSlides = slidesWithFootwear.map(s => ({
    ...s,
    // Handle image: use image_url if image is null/empty
    image: s.image || (s as any).image_url || '/hero/hero1.png',
    // Handle cta: use cta_text if cta is undefined
    cta: s.cta || (s as any).cta_text || 'SHOP NOW',
    // Handle link: use cta_link if link is undefined
    link: s.link || (s as any).cta_link || '/',
  }));

  const SLIDES = normalizedSlides;
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // autoplay
    const play = () => {
      timeoutRef.current = window.setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
      }, 5500);
    };
    play();
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [current]);

  const goTo = (index: number) => {
    setCurrent(index % SLIDES.length);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  };

  return (
    <div className="relative w-full overflow-hidden h-[68vh] md:h-[80vh]">
      {/* Slides: stacked absolutely */}
      {SLIDES.map((s, idx) => {
        const active = idx === current;
        return (
          <div
            key={s.id}
            aria-hidden={!active}
            className={[
              "absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(.2,.9,.2,1)]",
              active ? "opacity-100 translate-y-0 z-20" : "opacity-0 -translate-y-4 z-10 pointer-events-none",
            ].join(" ")}
          >
            {/* Ensure container provides positioning for next/image fill */}
            <div className="relative w-full h-full bg-black/5">
              <Image
                src={fileUrl(s.image) || '/hero/hero1.png'}
                alt={s.title}
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
                sizes="100vw"
                priority={idx === 0}
              />
              {/* Overlay / hero content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-center">
                <div className="max-w-6xl w-full px-6 md:px-12 text-center">
                  <h1 className="text-white text-3xl md:text-6xl font-bold tracking-wide uppercase drop-shadow-lg font-din">
                    {s.title}
                  </h1>
                  <p className="text-white/90 mt-3 md:mt-5 text-sm md:text-xl tracking-wider">
                    {s.subtitle}
                  </p>
                  <Link
                    href={s.link}
                    className="inline-block mt-6 md:mt-10 bg-[#C83232] hover:bg-[#a02828] text-white px-8 py-4 uppercase text-sm md:text-lg tracking-widest font-bold rounded-none shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    {s.cta} →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Controls: previous / next */}
      <div className="absolute inset-y-0 left-3 flex items-center z-30">
        <button
          aria-label="Previous slide"
          onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
          className="bg-black/50 hover:bg-black/60 text-white p-2 rounded-full"
        >
          ‹
        </button>
      </div>
      <div className="absolute inset-y-0 right-3 flex items-center z-30">
        <button
          aria-label="Next slide"
          onClick={() => goTo((current + 1) % SLIDES.length)}
          className="bg-black/50 hover:bg-black/60 text-white p-2 rounded-full"
        >
          ›
        </button>
      </div>

      {/* Pagination bullets */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === current ? "bg-white scale-110" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
