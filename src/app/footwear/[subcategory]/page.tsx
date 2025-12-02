import { fetchProducts, fetchProductBySlug, fileUrl } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import ProductDetailContent from "@/components/ProductDetailContent";
import Link from "next/link";
import { notFound } from "next/navigation";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

// Map subcategory slugs to CMS subcategory values for footwear
const SUBCATEGORY_MAP: Record<string, string | string[]> = {
  'men': ['Flats', 'Mules', 'Sneakers', 'Boots', 'Loafers', 'Sandals'],
  'women': ['Flats', 'Mules', 'Heels', 'Sandals', 'Boots', 'Sneakers'],
  'flats': 'Flats',
  'mules': 'Mules',
  'heels': 'Heels',
  'sandals': 'Sandals',
  'boots': 'Boots',
  'sneakers': 'Sneakers',
  'loafers': 'Loafers',
};

// Map subcategory slugs to gender categories
const GENDER_MAP: Record<string, string> = {
  'men': 'Men',
  'women': 'Women',
};

const TITLE_MAP: Record<string, string> = {
  'men': "Men's Footwear",
  'women': "Women's Footwear",
  'flats': 'Flats',
  'mules': 'Mules',
  'heels': 'Heels',
  'sandals': 'Sandals',
  'boots': 'Boots',
  'sneakers': 'Sneakers',
  'loafers': 'Loafers',
};

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

export default async function FootwearSubcategoryPage({ params }: PageProps) {
  const { subcategory } = await params;

  // 1. Check if it's a known subcategory (men or women)
  if (SUBCATEGORY_MAP[subcategory]) {
    const cmsSubcategory = SUBCATEGORY_MAP[subcategory];
    const displayTitle = TITLE_MAP[subcategory] || subcategory;
    const genderFilter = GENDER_MAP[subcategory] || null;
    
    let products: any[] = [];
    try {
      const allProducts = await fetchProducts();
      if (allProducts && Array.isArray(allProducts)) {
        products = allProducts.filter((p) => {
          const pSub = p.subcategory?.toLowerCase();
          const gender = p.gender_category?.toLowerCase();
          if (!pSub) return false;
          
          // For gender-based filtering (men/women)
          if (genderFilter) {
            if (gender !== genderFilter.toLowerCase()) return false;
          }
          
          // Check if subcategory matches footwear types
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
              <Link href="/footwear" className="text-gray-500 hover:text-gray-700">Footwear</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{displayTitle}</span>
            </nav>
          </div>
        </div>

        <div className="py-8 bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{displayTitle}</h1>
            <p className="text-amber-200">{products.length} products found</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No products found in this category.</p>
              <Link href="/footwear" className="text-amber-600 hover:underline mt-4 inline-block">
                ← Back to Footwear
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug || product.id.toString(),
                    price: product.price || 0,
                    sale_price: product.sale_price,
                    image: product.image_url || product.image || '/placeholders/product.jpg',
                    image_url: product.image_url,
                    category: 'footwear',
                    subcategory: product.subcategory,
                    gender_category: product.gender_category,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. If not a known subcategory, try to find a product by slug
  try {
    const product = await fetchProductBySlug(subcategory);
    
    if (product) {
      // Map Directus product to ProductDetail interface
      // Only show the main product image to avoid mismatched model photos
      const mainImage = product.image || product.image_url;
      const productDetail = {
        id: product.id,
        name: product.name,
        category: product.category || 'Footwear',
        categoryLabel: product.subcategory || 'Footwear',
        price: product.price,
        originalPrice: product.sale_price,
        image: fileUrl(mainImage) || '',
        gallery: [mainImage].filter(Boolean).map(img => fileUrl(img) || ''),
        description: product.description || '',
        sizes: product.sizes || [],
        rating: 4.5,
        reviewCount: 10
      };
      return <ProductDetailContent product={productDetail} />;
    }
  } catch (error) {
    console.error("Error fetching product by slug:", error);
  }

  // 3. Nothing found
  notFound();
}
