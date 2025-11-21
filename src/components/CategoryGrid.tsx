import Link from "next/link";
import { MOCK_DATA } from "@/lib/mock-data";

export default function CategoryGrid() {
    return (
        <section className="py-0">
            <div className="grid grid-cols-1 md:grid-cols-3 h-auto md:h-[600px]">
                {MOCK_DATA.categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={cat.link}
                        className="group relative block h-[400px] md:h-full overflow-hidden border-r border-white/10 last:border-r-0"
                    >
                        {/* Background Placeholder */}
                        <div className="absolute inset-0 bg-gray-800 group-hover:scale-105 transition-transform duration-700"></div>

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <h2 className="font-din text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter z-10 group-hover:tracking-widest transition-all duration-500">
                                {cat.title}
                            </h2>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
