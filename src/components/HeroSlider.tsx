"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MOCK_DATA } from "@/lib/mock-data";

const SLIDES = [
    {
        id: 1,
        image: "/hero-bg.jpg", // Using same image for now, would be different in real app
        title: "YOUR NEW FASHION CODE",
        subtitle: "Urban Clothing Stores in India",
        cta: "FIND YOUR CODE",
        link: "/store-locator"
    },
    {
        id: 2,
        image: "/hero-bg.jpg", // Placeholder
        title: "LIT ZONE DROPS",
        subtitle: "Exclusive Streetwear Collection",
        cta: "SHOP NOW",
        link: "/lit-zone"
    },
    {
        id: 3,
        image: "/hero-bg.jpg", // Placeholder
        title: "NEW ARRIVALS",
        subtitle: "Check out the latest trends",
        cta: "EXPLORE",
        link: "/men"
    }
];

export default function HeroSlider() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    return (
        <div className="relative h-[80vh] w-full overflow-hidden bg-black">
            {SLIDES.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover opacity-60"
                        priority={index === 0}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
                        <h2 className="font-din text-2xl md:text-4xl mb-2 tracking-widest uppercase opacity-0 animate-fadeInUp" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                            {slide.subtitle}
                        </h2>
                        <h1 className="font-din text-6xl md:text-8xl font-bold mb-8 tracking-tighter uppercase opacity-0 animate-fadeInUp" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
                            {slide.title}
                        </h1>
                        <Link
                            href={slide.link}
                            className="bg-white text-black px-8 py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors opacity-0 animate-fadeInUp"
                            style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
                        >
                            {slide.cta}
                        </Link>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? "bg-white" : "bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
