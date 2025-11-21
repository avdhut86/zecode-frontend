import Link from "next/link";
import { MOCK_DATA } from "@/lib/mock-data";

export default function Hero() {
    const { title, subtitle, cta } = MOCK_DATA.hero;

    return (
        <section className="relative h-[80vh] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
            {/* Background Image Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10"></div>

            {/* Content */}
            <div className="relative z-20 text-center text-white px-4">
                <h1 className="font-din text-6xl md:text-9xl font-bold uppercase tracking-tighter mb-4">
                    {title}
                </h1>
                <p className="text-xl md:text-2xl font-light tracking-widest mb-8 uppercase">
                    {subtitle}
                </p>
                <Link
                    href="/store-locator"
                    className="inline-block border-2 border-white px-10 py-4 text-lg font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                >
                    {cta}
                </Link>
            </div>
        </section>
    );
}
