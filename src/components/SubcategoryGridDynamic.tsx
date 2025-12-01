'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fileUrl, fetchProductCounts } from '@/lib/directus';

// Map from URL slug to CMS subcategory values
const SUBCATEGORY_TO_CMS: Record<string, string> = {
  'tshirts': 'T Shirt',
  'shirts': 'Shirt',
  'jeans': 'Jeans',
  'pants': 'Pants',
  'trousers': 'Trousers',
  'jackets': 'Jacket',
  'shoes': 'Flats',
  'accessories': 'Accessories',
  'tops': 'Top',
  'blouse': 'Blouse',
  'dresses': 'Dress',
  'skirts': 'Skirt',
  'outerwear': 'Jacket',
  'shorts': 'Shorts',
  // Kids-specific slugs
  'boys-tshirts': 'T',
  'girls-tops': 'Tops',
  'boys-jeans': 'Bottoms',
  'girls-dresses': 'Dresses',
  // Footwear - gender based
  'men': 'Flats',
  'women': 'Flats',
};

// Mapping from URL slugs to normalized CMS subcategory values for matching
const SLUG_TO_CMS_SUBCATEGORY: Record<string, string[]> = {
  // Men
  'tshirts': ['t', 'tshirt', 't-shirt'],
  'shirts': ['shirt'],
  'jeans': ['jean', 'jeans'],
  'trousers': ['trouser', 'trousers', 'pants', 'pant'],
  'jackets': ['jacket', 'outerwear'],
  'shoes': ['shoe', 'flats', 'flat'],
  // Women
  'tops': ['top', 'tops'],
  'dresses': ['dress', 'dresses'],
  'skirts': ['skirt', 'skirts'],
  // Kids - special mappings
  'boys-tshirts': ['t', 'tshirt', 't-shirt'],
  'girls-tops': ['top', 'tops'],
  'boys-jeans': ['bottom', 'bottoms', 'jean', 'jeans'],
  'girls-dresses': ['dress', 'dresses'],
  // Footwear - gender-based subcategories (check footwear types for each gender)
  'men': ['flats', 'flat', 'mules', 'mule', 'sneakers', 'sneaker', 'boots', 'boot', 'loafers', 'loafer', 'sandals', 'sandal'],
  'women': ['flats', 'flat', 'mules', 'mule', 'heels', 'heel', 'sandals', 'sandal', 'boots', 'boot', 'sneakers', 'sneaker'],
};

// Normalize subcategory for matching
const normalizeSub = (s?: string | null) => {
  if (!s) return "";
  return s.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
};

interface SubcategoryCardProps {
  title: string;
  slug: string;
  categorySlug: string;
}

function SubcategoryCard({ title, slug, categorySlug }: SubcategoryCardProps) {
  const [products, setProducts] = useState<Array<{ image_url?: string; image?: string; name: string }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProductImages() {
      try {
        // Special handling for Footwear category - slug is gender (men/women)
        const isFootwearCategory = categorySlug === 'footwear';
        
        let genderFilter: string | null = null;
        let subcategoryValue: string;
        
        if (isFootwearCategory) {
          // For footwear, the slug IS the gender, and we filter by footwear subcategories
          genderFilter = slug === 'men' ? 'Men' : slug === 'women' ? 'Women' : null;
          // Search for common footwear types
          subcategoryValue = 'Flats'; // Start with Flats as primary
        } else {
          subcategoryValue = SUBCATEGORY_TO_CMS[slug] || slug;
          // Add gender filter based on category slug to avoid cross-gender matches
          genderFilter =
            categorySlug === 'men' ? 'Men' : categorySlug === 'women' ? 'Women' : categorySlug === 'kids' ? 'Kids' : null;
        }

        // Try primary query with subcategory + gender
        const params = new URLSearchParams();
        params.set('limit', '10');
        params.set('fields', 'name,image_url,image');
        params.set(`filter[subcategory][_eq]`, subcategoryValue);
        if (genderFilter) params.set(`filter[gender_category][_eq]`, genderFilter);

        let response = await fetch(`/api/directus/items/products?${params.toString()}`);
        let data = response.ok ? await response.json() : null;

        // If no products returned, try footwear variants for footwear category
        if (isFootwearCategory && (!data || !data.data || data.data.length === 0)) {
          const footwearTypes = ['Mules', 'Heels', 'Sandals', 'Boots', 'Sneakers', 'Loafers'];
          
          for (const footwearType of footwearTypes) {
            const altParams = new URLSearchParams();
            altParams.set('limit', '10');
            altParams.set('fields', 'name,image_url,image');
            altParams.set(`filter[subcategory][_eq]`, footwearType);
            if (genderFilter) altParams.set(`filter[gender_category][_eq]`, genderFilter);

            response = await fetch(`/api/directus/items/products?${altParams.toString()}`);
            if (response.ok) {
              data = await response.json();
              if (data?.data?.length > 0) break;
            }
          }
        }

        // If no products returned, try a few fallback variants (hyphen/space/singular/plural)
        if (!isFootwearCategory && (!data || !data.data || data.data.length === 0)) {
          const variants = [
            subcategoryValue.replace(/\s+/g, '-'),
            subcategoryValue.replace(/-/g, ' '),
            subcategoryValue.replace(/s$/i, ''),
            (subcategoryValue + 's'),
          ];

          for (const variant of variants) {
            if (!variant) continue;
            const altParams = new URLSearchParams();
            altParams.set('limit', '10');
            altParams.set('fields', 'name,image_url,image');
            altParams.set(`filter[subcategory][_eq]`, variant);
            if (genderFilter) altParams.set(`filter[gender_category][_eq]`, genderFilter);

            response = await fetch(`/api/directus/items/products?${altParams.toString()}`);
            if (response.ok) {
              data = await response.json();
              if (data?.data?.length > 0) break;
            }
          }
        }

        if (data && data.data && data.data.length > 0) {
          // Prefer products that have images defined
          const withImages = data.data.filter((p: any) => p.image || p.image_url);
          const chosen = withImages.length > 0 ? withImages : data.data;
          setProducts(chosen);
          // Debug: log fetched products (image fields) for troubleshooting blank thumbnails
          // Remove this log after verifying behavior in the browser console
          try {
            // eslint-disable-next-line no-console
            console.log('Subcategory fetch:', slug, chosen.map((p: any) => ({ name: p.name, image: !!p.image, image_url: p.image_url })) );
          } catch (e) {
            // ignore
          }
        }
      } catch (error) {
        console.error('Error fetching products for subcategory:', slug, error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProductImages();
  }, [slug, categorySlug]);

  // Image cycling effect
  useEffect(() => {
    if (products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % products.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [products.length]);

  // Get current image URL
  const getCurrentImageUrl = useCallback(() => {
    if (products.length === 0) {
      return '/placeholders/product-placeholder.png';
    }
    const product = products[currentImageIndex];
    return fileUrl(product?.image || product?.image_url) || '/placeholders/product-placeholder.png';
  }, [products, currentImageIndex]);

  const imageUrl = getCurrentImageUrl();

  return (
    <Link
      href={`/${categorySlug}/${slug}`}
      className="group block relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      )}

      {/* Product image */}
      {!isLoading && (
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover object-center transition-opacity duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-lg font-semibold mb-1 group-hover:text-yellow-400 transition-colors">
          {title}
        </h3>
        {products.length > 0 && (
          <p className="text-sm text-gray-300 mb-2">
            {products.length} products
          </p>
        )}
        
        {/* Image indicators */}
        {products.length > 1 && (
          <div className="flex gap-1 mt-2">
            {products.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`h-1 w-6 rounded-full transition-all duration-300 ${
                  index === currentImageIndex % 5 ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
            {products.length > 5 && (
              <span className="text-xs text-gray-300 ml-1">+{products.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Shop Now button on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="bg-white text-black px-6 py-2 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          Shop Now
        </span>
      </div>
    </Link>
  );
}

interface SubcategoryGridDynamicProps {
  title: string;
  categorySlug: string;
  subcategories: Array<{
    title: string;
    slug: string;
  }>;
}

export default function SubcategoryGridDynamic({ title, categorySlug, subcategories }: SubcategoryGridDynamicProps) {
  const [filteredSubcategories, setFilteredSubcategories] = useState<Array<{ title: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function filterByProductCounts() {
      try {
        const counts = await fetchProductCounts();
        
        if (!counts || counts.length === 0) {
          // If no counts, show all subcategories
          setFilteredSubcategories(subcategories);
          setIsLoading(false);
          return;
        }

        // Build a map of gender||normalizedSub -> count
        const countsByGenderSub = new Map<string, number>();
        counts.forEach((c) => {
          const count = c.count || 0;
          if (count <= 0) return;
          
          const g = (c.gender_category || "").toString().toLowerCase();
          const sub = normalizeSub(c.subcategory || "");
          const key = `${g}||${sub}`;
          countsByGenderSub.set(key, (countsByGenderSub.get(key) || 0) + count);
        });

        // Helper to check if a subcategory has products
        const hasProducts = (categorySlug: string, slug: string) => {
          // Special case for footwear: slug is the gender (men/women)
          if (categorySlug === 'footwear') {
            const gender = slug.toLowerCase(); // 'men' or 'women'
            const footwearMappings = SLUG_TO_CMS_SUBCATEGORY[slug] || ['flats', 'mules', 'heels', 'sandals', 'boots', 'sneakers'];
            return footwearMappings.some(cmsVal => {
              const key = `${gender}||${cmsVal}`;
              return (countsByGenderSub.get(key) || 0) > 0;
            });
          }
          
          // Normal case: categorySlug is the gender
          const gender = categorySlug.toLowerCase();
          const cmsMappings = SLUG_TO_CMS_SUBCATEGORY[slug] || [normalizeSub(slug)];
          return cmsMappings.some(cmsVal => {
            const key = `${gender}||${cmsVal}`;
            return (countsByGenderSub.get(key) || 0) > 0;
          });
        };

        // Filter subcategories to only those with products > 0 for this category
        const filtered = subcategories.filter((subcat) => {
          return hasProducts(categorySlug, subcat.slug);
        });

        setFilteredSubcategories(filtered);
      } catch (error) {
        console.error('Error fetching product counts:', error);
        // On error, show all subcategories
        setFilteredSubcategories(subcategories);
      } finally {
        setIsLoading(false);
      }
    }

    filterByProductCounts();
  }, [categorySlug, subcategories]);

  if (isLoading) {
    return (
      <section className="py-12 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Shop {title}&apos;s Collection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (filteredSubcategories.length === 0) {
    return (
      <section className="py-12 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Shop {title}&apos;s Collection
          </h2>
          <p className="text-center text-gray-500">No products available in this category.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Shop {title}&apos;s Collection
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredSubcategories.map((subcategory) => (
            <SubcategoryCard
              key={subcategory.slug}
              title={subcategory.title}
              slug={subcategory.slug}
              categorySlug={categorySlug}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
