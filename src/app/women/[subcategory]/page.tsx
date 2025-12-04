import { fetchProducts, fetchProductBySlug, fileUrl } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import ProductDetailContent from "@/components/ProductDetailContent";
import Link from "next/link";
import { notFound } from "next/navigation";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

/**
 * Extract photo session ID from image path (e.g., "__DSC4648_Large" from the filename)
 * This helps match model images with the correct product
 */
function getSessionId(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  // Match patterns like __DSC1234 or _DSC1234
  const match = imagePath.match(/_?_?(DSC\d+)/i);
  return match ? match[1] : null;
}

/**
 * Build gallery with only matching model images (same photo session)
 */
function buildMatchingGallery(product: any): string[] {
  const mainImage = product.image || product.image_url;
  const mainSessionId = getSessionId(mainImage);
  
  // Start with the main product image
  const gallery: string[] = [mainImage].filter(Boolean);
  
  // Only add model images if they match the same photo session
  const modelImages = [
    product.model_image_1,
    product.model_image_2,
    product.model_image_3,
  ].filter(Boolean);
  
  for (const modelImg of modelImages) {
    const modelSessionId = getSessionId(modelImg);
    // Only include if session IDs match
    if (mainSessionId && modelSessionId && mainSessionId === modelSessionId) {
      gallery.push(modelImg);
    }
  }
  
  return gallery;
}

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
  'tshirts': ['T', 'T-Shirt'],
  'shirts': 'Shirt',
  'shorts': 'Shorts',
  'tunics': 'Tunic',
  'hoodies': 'Hoodie',
  'tanks': 'Tank',
  'sweaters': 'Sweater',
  'sweatpants': 'Sweatpants',
  'sweatshirts': 'Sweatshirt',
  'tracksuits': 'Track',
  'vests': 'Vest',
  'visors': 'Visor',
  'backpacks': 'Backpack',
  'flats': 'Flats',
  'mules': 'Mules',
  'apparel': 'Apparel',  // Generic fallback
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
  'tshirts': 'T-Shirts',
  'shirts': 'Shirts',
  'shorts': 'Shorts',
  'tunics': 'Tunics',
  'hoodies': 'Hoodies',
  'tanks': 'Tank Tops',
  'sweaters': 'Sweaters',
  'sweatpants': 'Sweatpants',
  'sweatshirts': 'Sweatshirts',
  'tracksuits': 'Tracksuits',
  'vests': 'Vests',
  'visors': 'Visors',
  'backpacks': 'Backpacks',
  'flats': 'Flats',
  'mules': 'Mules',
  'apparel': 'Apparel',
};

// Reverse mapping from CMS subcategory values to route slugs
function getSubcategorySlug(cmsSubcategory: string | null | undefined): string {
  if (!cmsSubcategory) return 'women';
  const lowerSub = cmsSubcategory.toLowerCase();
  for (const [slug, cmsValues] of Object.entries(SUBCATEGORY_MAP)) {
    if (Array.isArray(cmsValues)) {
      if (cmsValues.some(v => v.toLowerCase() === lowerSub)) return slug;
    } else if (cmsValues.toLowerCase() === lowerSub) {
      return slug;
    }
  }
  return 'women'; // fallback
}

// Get display title from CMS subcategory
function getSubcategoryTitle(cmsSubcategory: string | null | undefined): string {
  const slug = getSubcategorySlug(cmsSubcategory);
  return TITLE_MAP[slug] || cmsSubcategory || 'Women';
}

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
    // Build gallery with matching model images (same photo session)
    const gallery = buildMatchingGallery(product);
    
    // Get proper subcategory slug and title
    const subcategorySlug = getSubcategorySlug(product.subcategory);
    const subcategoryTitle = getSubcategoryTitle(product.subcategory);
    
    const productDetail = {
      id: product.id,
      name: product.name,
      category: `women/${subcategorySlug}`,  // Route path like "women/dresses"
      categoryLabel: subcategoryTitle,        // Display title like "Dresses"
      price: product.price,
      originalPrice: product.sale_price,
      image: fileUrl(gallery[0]) || '',
      gallery: gallery.map(img => fileUrl(img) || ''),
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