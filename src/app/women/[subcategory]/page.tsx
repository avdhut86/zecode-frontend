import { fetchProducts, fetchProductBySlug, fileUrl } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import ProductDetailContent from "@/components/ProductDetailContent";
import Link from "next/link";
import { notFound } from "next/navigation";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

const SUBCATEGORY_MAP: Record<string, string | string[]> = {
  'tops': ['Top', 'Tops'],
  'blouses': 'Blouse',
  'dresses': ['Dress', 'Dresses'],
  'jeans': 'Jeans',
  'pants': 'Pants',
  'skirts': 'Skirt',
  'jackets': 'Jacket',
  'shoes': 'Footwear',
  'accessories': 'Accessories',
};

const TITLE_MAP: Record<string, string> = {
  'tops': 'Tops',
  'blouses': 'Blouses',
  'dresses': 'Dresses',
  'jeans': 'Jeans',
  'pants': 'Pants',
  'skirts': 'Skirts',
  'jackets': 'Jackets',
  'shoes': 'Shoes',
  'accessories': 'Accessories',
};

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

export default async function WomenSubcategoryPage({ params }: PageProps) {
  const { subcategory } = await params;

  // 1. Check if it's a known subcategory
  if (SUBCATEGORY_MAP[subcategory]) {
    const cmsSubcategory = SUBCATEGORY_MAP[subcategory];
    const displayTitle = TITLE_MAP[subcategory] || subcategory;
    
    let products: any[] = [];
    try {
      const allProducts = await fetchProducts();
      if (allProducts && Array.isArray(allProducts)) {
        products = allProducts.filter((p) => {
          const pSub = p.subcategory?.toLowerCase();
          const gender = p.gender_category?.toLowerCase();
          if (!pSub || !gender) return false;
          if (gender !== "women") return false;
          if (Array.isArray(cmsSubcategory)) {
            return cmsSubcategory.some(s => s.toLowerCase() === pSub);
          }
          return pSub === (cmsSubcategory as string).toLowerCase();
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }

    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/women" className="text-gray-500 hover:text-gray-700">Women</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{displayTitle}</span>
            </nav>
          </div>
        </div>

        <div className="py-8 bg-gradient-to-r from-pink-900 to-pink-700">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Women&apos;s {displayTitle}</h1>
            <p className="text-pink-200">{products.length} products found</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No products found in this category.</p>
              <Link href="/women" className="mt-4 inline-block text-pink-600 hover:underline">Browse all Women&apos;s products</Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. If not a subcategory, try to fetch as product
  const product = await fetchProductBySlug(subcategory);
  
  if (product) {
    // Map Directus product to ProductDetail interface
    const productDetail = {
      id: product.id,
      name: product.name,
      category: product.category || 'Women',
      categoryLabel: product.subcategory || 'Women',
      price: product.price,
      originalPrice: product.sale_price,
      image: fileUrl(product.image || product.image_url) || '',
      gallery: [
        product.image || product.image_url,
        product.model_image_1,
        product.model_image_2,
        product.model_image_3,
        ...(product.images || [])
      ].filter(Boolean).map(img => fileUrl(img) || ''),
      description: product.description || '',
      sizes: product.sizes || [],
      rating: 4.5, // Mock rating
      reviewCount: 10 // Mock review count
    };

    return <ProductDetailContent product={productDetail} />;
  }

  // 3. If neither, 404
  notFound();
}

export async function generateStaticParams() {
  return Object.keys(SUBCATEGORY_MAP).map((subcategory) => ({ subcategory }));
}