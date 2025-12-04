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

// Build gallery with model images - include AI-generated images from Cloudinary
function buildMatchingGallery(product: any): string[] {
  const mainImage = product.image || product.image_url;
  const mainSessionId = getSessionId(mainImage);
  
  // Start with just the main product image
  const gallery: string[] = [mainImage].filter(Boolean);
  
  // Add model images - either matching session ID or AI-generated (Cloudinary URLs)
  const modelImages = [product.model_image_1, product.model_image_2, product.model_image_3].filter(Boolean);
  
  for (const modelImg of modelImages) {
    const modelSessionId = getSessionId(modelImg);
    // Include if: session IDs match OR it's an AI-generated image (Cloudinary URL)
    const isCloudinaryImage = modelImg.includes('cloudinary.com');
    const isMatchingSession = mainSessionId && modelSessionId && mainSessionId === modelSessionId;
    
    if (isCloudinaryImage || isMatchingSession) {
      gallery.push(modelImg);
    }
  }
  
  return gallery;
}

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

// Reverse mapping from CMS subcategory values to route slugs
function getSubcategorySlug(cmsSubcategory: string | null | undefined): string {
  if (!cmsSubcategory) return 'footwear';
  const lowerSub = cmsSubcategory.toLowerCase();
  for (const [slug, cmsValues] of Object.entries(SUBCATEGORY_MAP)) {
    if (Array.isArray(cmsValues)) {
      if (cmsValues.some(v => v.toLowerCase() === lowerSub)) return slug;
    } else if (cmsValues.toLowerCase() === lowerSub) {
      return slug;
    }
  }
  return 'footwear'; // fallback
}

// Get display title from CMS subcategory
function getSubcategoryTitle(cmsSubcategory: string | null | undefined): string {
  const slug = getSubcategorySlug(cmsSubcategory);
  return TITLE_MAP[slug] || cmsSubcategory || 'Footwear';
}

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
      // Build gallery with matching model images from the same photo session
      const mainImage = product.image || product.image_url;
      const matchingGallery = buildMatchingGallery(product);
      
      // Get proper subcategory slug and title
      const subcategorySlug = getSubcategorySlug(product.subcategory);
      const subcategoryTitle = getSubcategoryTitle(product.subcategory);
      
      const productDetail = {
        id: product.id,
        name: product.name,
        category: `footwear/${subcategorySlug}`,  // Route path like "footwear/flats"
        categoryLabel: subcategoryTitle,           // Display title like "Flats"
        price: product.price,
        originalPrice: product.sale_price,
        image: fileUrl(mainImage) || '',
        gallery: matchingGallery.map(img => fileUrl(img) || ''),
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
