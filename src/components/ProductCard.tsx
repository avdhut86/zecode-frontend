import Image from "next/image";
import Link from "next/link";
import { fileUrl, type Product } from "@/lib/directus";

export default function ProductCard({ product }: { product: Product }) {
    const imageUrl = fileUrl(product.image || product.image_url) || "/placeholders/product-placeholder.png";
    
    const genderPath = product.gender_category ? product.gender_category.toLowerCase() : 'product';
    
    return (
        <Link href={`/${genderPath}/${product.slug}`} className="group block">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                {/* Product image */}
                <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    style={{ objectFit: "cover", objectPosition: "center" }}
                    className="transition-opacity duration-300 group-hover:opacity-90"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>

            <div className="mt-4 space-y-1">
                <h3 className="font-din text-xl font-bold uppercase tracking-wide text-black group-hover:text-gray-600 transition-colors">
                    {product.name}
                </h3>
                <p className="font-sans text-sm font-medium text-gray-900">
                    ₹{(product.price ?? 0).toLocaleString()}
                </p>
            </div>
        </Link>
    );
}
