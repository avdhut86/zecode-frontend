import { fetchProducts, fetchProductBySlug, fileUrl } from "@/lib/directus";
import ProductCard from "@/components/ProductCard";
import ProductDetailContent from "@/components/ProductDetailContent";
import Link from "next/link";
import { notFound } from "next/navigation";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

// Helper to extract photo session ID (e.g., DSC1234) from image path
function getSessionId(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  // Match patterns like __DSC1234 or _DSC1234 in the filename
  const match = imagePath.match(/_?_?(DSC\d+)/i);
  return match ? match[1] : null;
}

// Build gallery with only matching model images from the same photo session
function buildMatchingGallery(product: any): string[] {
  const mainImage = product.image || product.image_url;
  const mainSessionId = getSessionId(mainImage);
  
  // Start with just the main product image
  const gallery: string[] = [mainImage].filter(Boolean);
  
  // Only add model images that match the same photo session
  const modelImages = [product.model_image_1, product.model_image_2, product.model_image_3].filter(Boolean);
  
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
  'tshirts': ['T', 'T-Shirt'],
  'shirts': 'Shirt',
  'pants': 'Pants',
  'jeans': 'Jeans',
  'dresses': ['Dress', 'Dresses'],
  'jackets': ['Jacket', 'Outerwear'],
  'shoes': ['Footwear', 'Flats', 'Flat'],
  'accessories': 'Accessories',
  // Kids-specific slugs
  'boys-tshirts': 'T',
  'girls-tops': 'Tops',
  'boys-jeans': 'Bottoms',
  'girls-dresses': 'Dresses',
  // Additional kids subcategories
  'tops': 'Tops',
  'bottoms': 'Bottoms',
  'tracksuits': 'Tracksuit',
  'jumpsuits': 'Jumpsuits',
  'outerwear': 'Outerwear',
  'apparel': 'Apparel',  // Generic fallback
};

const TITLE_MAP: Record<string, string> = {
  'tshirts': 'T-Shirts',
  'shirts': 'Shirts',
  'pants': 'Pants',
  'jeans': 'Jeans',
  'dresses': 'Dresses',
  'jackets': 'Jackets',
  'shoes': 'Shoes',
  'accessories': 'Accessories',
  // Kids-specific slugs
  'boys-tshirts': "Boys' T-Shirts",
  'girls-tops': "Girls' Tops",
  'boys-jeans': "Boys' Jeans",
  'girls-dresses': "Girls' Dresses",
  // Additional kids subcategories
  'tops': 'Tops',
  'bottoms': 'Bottoms',
  'tracksuits': 'Tracksuits',
  'jumpsuits': 'Jumpsuits',
  'outerwear': 'Outerwear',
  'apparel': 'Apparel',
};

// Reverse mapping from CMS subcategory values to route slugs
function getSubcategorySlug(cmsSubcategory: string | null | undefined): string {
  if (!cmsSubcategory) return 'kids';
  const lowerSub = cmsSubcategory.toLowerCase();
  for (const [slug, cmsValues] of Object.entries(SUBCATEGORY_MAP)) {
    if (Array.isArray(cmsValues)) {
      if (cmsValues.some(v => v.toLowerCase() === lowerSub)) return slug;
    } else if (cmsValues.toLowerCase() === lowerSub) {
      return slug;
    }
  }
  return 'kids'; // fallback
}

// Get display title from CMS subcategory
function getSubcategoryTitle(cmsSubcategory: string | null | undefined): string {
  const slug = getSubcategorySlug(cmsSubcategory);
  return TITLE_MAP[slug] || cmsSubcategory || 'Kids';
}

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

export default async function KidsSubcategoryPage({ params }: PageProps) {
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
          // Filter by Kids gender_category
          if (gender !== "kids") return false;
          
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
              <Link href="/kids" className="text-gray-500 hover:text-gray-700">Kids</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{displayTitle}</span>
            </nav>
          </div>
        </div>

        <div className="py-8 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Kids' {displayTitle}</h1>
            <p className="text-blue-200">{products.length} products found</p>
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
              <Link href="/kids" className="mt-4 inline-block text-blue-600 hover:underline">Browse all Kids' products</Link>
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
    // Build gallery with matching model images from the same photo session
    const mainImage = product.image || product.image_url;
    const matchingGallery = buildMatchingGallery(product);
    
    // Get proper subcategory slug and title
    const subcategorySlug = getSubcategorySlug(product.subcategory);
    const subcategoryTitle = getSubcategoryTitle(product.subcategory);
    
    const productDetail = {
      id: product.id,
      name: product.name,
      category: `kids/${subcategorySlug}`,  // Route path like "kids/tshirts"
      categoryLabel: subcategoryTitle,       // Display title like "T-Shirts"
      price: product.price,
      originalPrice: product.sale_price,
      image: fileUrl(mainImage) || '',
      gallery: matchingGallery.map(img => fileUrl(img) || ''),
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