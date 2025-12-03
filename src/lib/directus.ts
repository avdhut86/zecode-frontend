// src/lib/directus.ts
import axios from "axios";
import { unstable_cache } from "next/cache";

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://127.0.0.1:8055";

/**
 * Cache Strategy:
 * - Products: 5 minutes (frequently viewed, balance between freshness and speed)
 * - Hero slides: 10 minutes (rarely changes)
 * - Stores: 30 minutes (very stable data)
 * - Categories: 10 minutes (rarely changes)
 * 
 * All caches use stale-while-revalidate pattern on Vercel
 */
const CACHE_PRODUCTS = 300;      // 5 minutes
const CACHE_HERO = 600;          // 10 minutes  
const CACHE_STORES = 1800;       // 30 minutes
const CACHE_CATEGORIES = 600;    // 10 minutes

// Request timeout - increased for Render cold starts
const TIMEOUT_DEFAULT = 15000;   // 15 seconds
const TIMEOUT_PRODUCTS = 30000;  // 30 seconds for products (larger payload)

// Helper to get the correct URL - uses proxy on client-side to avoid CORS
function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: use local API proxy to avoid CORS issues
    return `/api/directus${path}`;
  }
  // Server-side: call Directus directly
  return `${DIRECTUS}${path}`;
}

export type GlobalSettings = {
  site_name?: string;
  site_logo?: string; // ID of the file
  header_nav?: { label: string; href: string }[];
  footer_nav?: { label: string; href: string }[];
  social_links?: { label: string; href: string; icon?: string }[];
  footer_text?: string;
};

export type HeroSlide = {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  sort?: number;
};

export type Category = {
  id: number;
  title: string;
  slug: string;
  image: string;
  link: string;
  sort?: number;
  subcategories?: Subcategory[];
};

export type Subcategory = {
  id: number;
  title: string;
  slug: string;
  image: string;
  link: string;
  category_id?: number;
  sort?: number;
};

/**
 * fetchPage - safe fetch of page by slug
 * returns page object or null (never throws)
 */
export async function fetchPage(slug: string) {
  try {
    const url = getApiUrl("/items/pages");
    const res = await axios.get(url, {
      params: { "filter[slug][_eq]": slug, limit: 1 },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data?.[0] ?? null;
  } catch (err: any) {
    console.error("Directus fetchPage error:", err?.response?.data ?? err.message ?? err);
    return null;
  }
}

/**
 * fetchGlobalSettings - fetch global site settings (header, footer, etc.)
 * Assumes a singleton collection named 'globals'
 */
export async function fetchGlobalSettings(): Promise<GlobalSettings | null> {
  try {
    const url = getApiUrl("/items/globals");
    const res = await axios.get(url, {
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    // Silent fail or log if needed, but don't crash app
    // console.warn("Directus fetchGlobalSettings error (backend might not be ready):", err.message);
    return null;
  }
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'ds8llatku';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/** 
 * Transform local path to Cloudinary URL
 * /products/image.jpg → https://res.cloudinary.com/ds8llatku/image/upload/f_auto,q_auto/zecode/products/image
 */
function getCloudinaryUrl(localPath: string): string {
  // Remove leading slash and file extension
  const cleanPath = localPath.replace(/^\//, '').replace(/\.[^.]+$/, '');
  // Add auto format and quality optimization
  return `${CLOUDINARY_BASE_URL}/f_auto,q_auto/zecode/${cleanPath}`;
}

/** fileUrl helper */
export function fileUrl(file: any) {
  if (!file) return null;
  const id = typeof file === "string" ? file : (file?.id ?? file?.data?.id);
  if (!id) return null;
  
  // If it's already a full URL (http/https), return as is
  if (typeof id === 'string' && id.startsWith('http')) {
    return id;
  }
  
  // If it's a local path (starts with /), transform to Cloudinary URL
  if (typeof id === 'string' && id.startsWith('/')) {
    // Check if it's one of our image folders
    if (id.startsWith('/products/') || id.startsWith('/categories/') || 
        id.startsWith('/hero/') || id.startsWith('/brand/') || 
        id.startsWith('/placeholders/')) {
      return getCloudinaryUrl(id);
    }
    // Other local paths (like fonts) stay as-is
    return id;
  }

  // Otherwise treat as Directus asset ID
  return `/api/directus/assets/${id}`;
}

/**
 * fetchHeroSlides - fetch all hero slider images and content (cached)
 */
async function _fetchHeroSlides(): Promise<HeroSlide[] | null> {
  try {
    const url = getApiUrl("/items/hero_slides");
    const res = await axios.get(url, {
      params: { sort: "sort" },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchHeroSlides error:", err.message);
    return null;
  }
}

// Cached version of fetchHeroSlides
export const fetchHeroSlides = typeof window === 'undefined' 
  ? unstable_cache(_fetchHeroSlides, ['hero-slides-v1'], { revalidate: CACHE_HERO, tags: ['hero'] })
  : _fetchHeroSlides;

/**
 * fetchCategories - fetch all main categories with their subcategories
 */
export async function fetchCategories(): Promise<Category[] | null> {
  try {
    const url = getApiUrl("/items/categories");
    const res = await axios.get(url, {
      params: { 
        sort: "sort",
        fields: "*,subcategories.*"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchCategories error:", err.message);
    return null;
  }
}

/**
 * fetchCategoryBySlug - fetch a specific category with subcategories
 */
export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const url = getApiUrl("/items/categories");
    const res = await axios.get(url, {
      params: { 
        "filter[slug][_eq]": slug,
        fields: "*,subcategories.*",
        limit: 1
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data?.[0] ?? null;
  } catch (err: any) {
    console.error("Directus fetchCategoryBySlug error:", err.message);
    return null;
  }
}

// =============================================
// STORES
// =============================================

export type Store = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  image?: string;
  status?: string;
  sort?: number;
};

/**
 * fetchStores - fetch all store locations (cached)
 */
async function _fetchStores(): Promise<Store[] | null> {
  try {
    const url = getApiUrl("/items/stores");
    const res = await axios.get(url, {
      params: { 
        sort: "sort,name",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchStores error:", err.message);
    return null;
  }
}

// Cached version of fetchStores
export const fetchStores = typeof window === 'undefined'
  ? unstable_cache(_fetchStores, ['stores-v1'], { revalidate: CACHE_STORES, tags: ['stores'] })
  : _fetchStores;

/**
 * fetchStoreById - fetch a single store by ID
 */
export async function fetchStoreById(id: number | string): Promise<Store | null> {
  try {
    const url = getApiUrl(`/items/stores/${id}`);
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchStoreById error:", err.message);
    return null;
  }
}

// =============================================
// PRODUCTS
// =============================================

export type Product = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number;
  image?: string;
  image_url?: string;
  model_image_1?: string;
  model_image_2?: string;
  model_image_3?: string;
  images?: string[];
  category?: string;
  subcategory?: string;
  gender_category?: string;
  sizes?: string[];
  colors?: string[];
  status?: string;
  featured?: boolean;
  sort?: number;
};

export type ProductCount = {
  subcategory?: string | null;
  gender_category?: string | null;
  count: number;
};

/**
 * fetchProducts - fetch all products (cached with retry)
 */
async function _fetchProducts(): Promise<Product[] | null> {
  const maxRetries = 2;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = getApiUrl("/items/products");
      if (attempt > 1) {
        console.log(`[Directus] Retrying products fetch (attempt ${attempt})...`);
      }
      const res = await axios.get(url, {
        params: { 
          sort: "sort,name",
          limit: -1,  // Get all products
        },
        timeout: TIMEOUT_PRODUCTS,
      });
      const products = res?.data?.data ?? null;
      if (products && products.length > 0) {
        console.log(`[Directus] Fetched ${products.length} products`);
        return products;
      }
      // Empty response, try again
      lastError = new Error('Empty response');
    } catch (err: any) {
      lastError = err;
      console.warn(`[Directus] fetchProducts attempt ${attempt} failed:`, err.message);
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  
  console.error("[Directus] fetchProducts failed after retries:", lastError?.message);
  return null;
}

// Cached version of fetchProducts
export const fetchProducts = typeof window === 'undefined'
  ? unstable_cache(_fetchProducts, ['products-v3'], { revalidate: CACHE_PRODUCTS, tags: ['products'] })
  : _fetchProducts;

/**
 * fetchProductsByCategory - fetch products by category slug (cached)
 */
async function _fetchProductsByCategory(categorySlug: string): Promise<Product[] | null> {
  try {
    const url = getApiUrl("/items/products");
    const res = await axios.get(url, {
      params: { 
        sort: "sort,name",
        "filter[category][_eq]": categorySlug,
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchProductsByCategory error:", err.message);
    return null;
  }
}

// Cached version of fetchProductsByCategory
export const fetchProductsByCategory = typeof window === 'undefined'
  ? (categorySlug: string) => unstable_cache(
      () => _fetchProductsByCategory(categorySlug),
      [`products-cat-${categorySlug}`],
      { revalidate: CACHE_PRODUCTS, tags: ['products'] }
    )()
  : _fetchProductsByCategory;

/**
 * fetchProductBySlug - fetch a single product by slug
 */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const url = getApiUrl("/items/products");
    const res = await axios.get(url, {
      params: { 
        "filter[slug][_eq]": slug,
        limit: 1
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data?.[0] ?? null;
  } catch (err: any) {
    console.error("Directus fetchProductBySlug error:", err.message);
    return null;
  }
}

/**
 * fetchProductCounts - aggregate product counts grouped by subcategory and gender
 * Returns an array of { subcategory, gender_category, count }
 */
export async function fetchProductCounts(): Promise<ProductCount[] | null> {
  try {
    const url = getApiUrl("/items/products");
    // Directus aggregation: aggregate[count]=id&groupBy[]=subcategory&groupBy[]=gender_category
    const res = await axios.get(url, {
      params: {
        "aggregate[count]": "id",
        "groupBy[]": ["subcategory", "gender_category"],
      },
      timeout: 15000,
    });

    // Directus returns aggregated results inside res.data?.data
    // Normalise to array of { subcategory, gender_category, count }
    const raw = res?.data?.data ?? null;
    if (!raw) return null;

    // raw may be an array of objects where count is under count, count.id, count(id), or count__id
    const parsed: ProductCount[] = raw.map((r: any) => {
      // find numeric value inside object - Directus returns { count: { id: "12" } }
      let count = 0;
      if (typeof r.count === 'number') count = r.count;
      else if (r.count && typeof r.count === 'object' && r.count.id) count = parseInt(r.count.id, 10) || 0;
      else if (typeof r["count(id)"] === 'number') count = r["count(id)"];
      else if (typeof r["count__id"] === 'number') count = r["count__id"];

      return {
        subcategory: r.subcategory ?? null,
        gender_category: r.gender_category ?? null,
        count,
      };
    });

    return parsed;
  } catch (err: any) {
    // If aggregation isn't supported or fails, fall back to a lightweight client-side count
    try {
      const products = await fetchProducts();
      if (!products) return null;
      const map = new Map<string, number>();
      products.forEach((p: Product) => {
        if (p.status !== 'published') return;
        const key = `${(p.gender_category||'').toLowerCase()}||${(p.subcategory||'').toLowerCase()}`;
        map.set(key, (map.get(key) || 0) + 1);
      });
      const out: ProductCount[] = [];
      for (const [k, v] of map.entries()) {
        const [gender, sub] = k.split('||');
        out.push({ gender_category: gender || null, subcategory: sub || null, count: v });
      }
      return out;
    } catch (e: unknown) {
      console.error('fetchProductCounts fallback failed:', e instanceof Error ? e.message : e);
      return null;
    }
  }
}

// =============================================
// NAVIGATION & SETTINGS
// =============================================

export type NavigationItem = {
  id: number;
  label: string;
  href: string;
  icon?: string;
  parent_id?: number;
  children?: NavigationItem[];
  sort?: number;
};

export type SiteSettings = {
  id: number;
  site_name?: string;
  site_tagline?: string;
  logo?: string;
  favicon?: string;
  primary_color?: string;
  secondary_color?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
};

export type HeaderSettings = {
  id: number;
  promo_banner_text?: string;
  promo_banner_link?: string;
  promo_banner_enabled?: boolean;
  logo?: string;
};

export type FooterSettings = {
  id: number;
  copyright_text?: string;
  newsletter_title?: string;
  newsletter_description?: string;
  show_newsletter?: boolean;
};

export type SocialLink = {
  id: number;
  platform: string;
  url: string;
  icon?: string;
  sort?: number;
};

/**
 * fetchNavigationMenu - fetch navigation menu items
 */
export async function fetchNavigationMenu(): Promise<NavigationItem[] | null> {
  try {
    const url = getApiUrl("/items/navigation_menu");
    const res = await axios.get(url, {
      params: { sort: "sort" },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchNavigationMenu error:", err.message);
    return null;
  }
}

/**
 * fetchSiteSettings - fetch global site settings (singleton)
 */
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  try {
    const url = getApiUrl("/items/site_settings");
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchSiteSettings error:", err.message);
    return null;
  }
}

/**
 * fetchHeaderSettings - fetch header configuration (singleton)
 */
export async function fetchHeaderSettings(): Promise<HeaderSettings | null> {
  try {
    const url = getApiUrl("/items/header_settings");
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchHeaderSettings error:", err.message);
    return null;
  }
}

/**
 * fetchFooterSettings - fetch footer configuration (singleton)
 */
export async function fetchFooterSettings(): Promise<FooterSettings | null> {
  try {
    const url = getApiUrl("/items/footer_settings");
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchFooterSettings error:", err.message);
    return null;
  }
}

/**
 * fetchSocialLinks - fetch social media links
 */
export async function fetchSocialLinks(): Promise<SocialLink[] | null> {
  try {
    const url = getApiUrl("/items/social_links");
    const res = await axios.get(url, {
      params: { sort: "sort" },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchSocialLinks error:", err.message);
    return null;
  }
}

export type FooterLinkGroup = {
  id: number;
  title: string;
  sort?: number;
  status?: string;
};

export type FooterLink = {
  id: number;
  label: string;
  href: string;
  group: number;
  sort?: number;
  status?: string;
  open_in_new_tab?: boolean;
};

export type DirectusSocialLink = {
  id: number;
  platform: string;
  url: string;
  custom_icon?: string;
  sort?: number;
  status?: string;
};

/**
 * fetchFooterLinkGroups - fetch footer link groups
 */
export async function fetchFooterLinkGroups(): Promise<FooterLinkGroup[] | null> {
  try {
    const url = getApiUrl("/items/footer_link_groups");
    const res = await axios.get(url, {
      params: { 
        sort: "sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchFooterLinkGroups error:", err.message);
    return null;
  }
}

/**
 * fetchFooterLinks - fetch all footer links
 */
export async function fetchFooterLinks(): Promise<FooterLink[] | null> {
  try {
    const url = getApiUrl("/items/footer_links");
    const res = await axios.get(url, {
      params: { 
        sort: "group,sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchFooterLinks error:", err.message);
    return null;
  }
}

/**
 * fetchDirectusSocialLinks - fetch social links from social_links collection
 */
export async function fetchDirectusSocialLinks(): Promise<DirectusSocialLink[] | null> {
  try {
    const url = getApiUrl("/items/social_links");
    const res = await axios.get(url, {
      params: { 
        sort: "sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchDirectusSocialLinks error:", err.message);
    return null;
  }
}

export type DirectusNavigationItem = {
  id: number;
  label: string;
  href: string;
  parent: number | null;
  icon?: string;
  highlight?: boolean;
  sort?: number;
  status?: string;
};

/**
 * fetchDirectusNavigation - fetch full navigation menu with parent/child structure
 */
export async function fetchDirectusNavigation(): Promise<DirectusNavigationItem[] | null> {
  try {
    const url = getApiUrl("/items/navigation_menu");
    const res = await axios.get(url, {
      params: { 
        sort: "parent,sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchDirectusNavigation error:", err.message);
    return null;
  }
}

export type DirectusFooterSettings = {
  id: number;
  footer_bg_color?: string;
  copyright_text?: string;
  newsletter_title?: string;
  newsletter_subtitle?: string;
  newsletter_enabled?: boolean;
};

/**
 * fetchDirectusFooterSettings - fetch footer settings (singleton)
 */
export async function fetchDirectusFooterSettings(): Promise<DirectusFooterSettings | null> {
  try {
    const url = getApiUrl("/items/footer_settings");
    const res = await axios.get(url, { timeout: TIMEOUT_DEFAULT });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchDirectusFooterSettings error:", err.message);
    return null;
  }
}

// =============================================
// HOMEPAGE SECTIONS
// =============================================

export type HomepageSection = {
  id: number;
  section_key: string;
  title?: string;
  subtitle?: string;
  description?: string;
  cta_text?: string;
  cta_link?: string;
  image?: string;
  background_color?: string;
  text_color?: string;
  status?: string;
  sort?: number;
};

/**
 * fetchHomepageSections - fetch homepage content sections
 */
export async function fetchHomepageSections(): Promise<HomepageSection[] | null> {
  try {
    const url = getApiUrl("/items/homepage_sections");
    const res = await axios.get(url, {
      params: { 
        sort: "sort",
        "filter[status][_eq]": "published"
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchHomepageSections error:", err.message);
    return null;
  }
}

/**
 * fetchHomepageSection - fetch a specific section by key
 */
export async function fetchHomepageSection(sectionKey: string): Promise<HomepageSection | null> {
  try {
    const url = getApiUrl("/items/homepage_sections");
    const res = await axios.get(url, {
      params: { 
        "filter[section_key][_eq]": sectionKey,
        limit: 1
      },
      timeout: TIMEOUT_DEFAULT,
    });
    return res?.data?.data?.[0] ?? null;
  } catch (err: any) {
    console.error("Directus fetchHomepageSection error:", err.message);
    return null;
  }
}

