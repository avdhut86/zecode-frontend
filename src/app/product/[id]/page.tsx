import { MOCK_DATA } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const productId = parseInt(id, 10);

    const product = MOCK_DATA.products.find((p) => p.id === productId);

    if (!product) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-white py-10">
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <nav className="text-sm text-gray-500 mb-8">
                    <Link href="/" className="hover:text-black">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/${product.category}`} className="hover:text-black capitalize">{product.category}</Link>
                    <span className="mx-2">/</span>
                    <span className="text-black">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Image Section */}
                    <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400">
                            <span className="text-xl uppercase tracking-widest">No Image</span>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div>
                        <h1 className="font-din text-5xl font-bold uppercase tracking-tight mb-4">
                            {product.name}
                        </h1>
                        <p className="text-2xl font-medium text-gray-900 mb-6">
                            ₹{product.price.toLocaleString()}
                        </p>

                        <div className="prose prose-lg text-gray-600 mb-8">
                            <p>{product.description}</p>
                        </div>

                        {/* Sizes */}
                        {product.sizes && (
                            <div className="mb-8">
                                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Select Size</h3>
                                <div className="flex gap-3">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size}
                                            className="w-12 h-12 flex items-center justify-center border border-gray-300 hover:border-black hover:bg-black hover:text-white transition-all"
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add to Cart Button */}
                        <button className="w-full md:w-auto bg-black text-white px-12 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
