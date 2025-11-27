// src/lib/directus.ts
import axios from "axios";

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";

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
    if (!DIRECTUS || DIRECTUS === "undefined") {
      console.error("Directus base URL is not set. Check NEXT_PUBLIC_DIRECTUS_URL in .env.local");
      return null;
    }

    const url = new URL("/items/pages", DIRECTUS).toString(); // ensures valid absolute URL
    const res = await axios.get(url, {
      params: { "filter[slug][_eq]": slug, limit: 1 },
      timeout: 5000,
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
    if (!DIRECTUS || DIRECTUS === "undefined") return null;

    const url = new URL("/items/globals", DIRECTUS).toString();
    const res = await axios.get(url, {
      timeout: 5000,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    // Silent fail or log if needed, but don't crash app
    // console.warn("Directus fetchGlobalSettings error (backend might not be ready):", err.message);
    return null;
  }
}

/** fileUrl helper */
export function fileUrl(file: any) {
  if (!file) return null;
  const id = typeof file === "string" ? file : (file?.id ?? file?.data?.id);
  if (!id) return null;
  if (!DIRECTUS || DIRECTUS === "undefined") return `/assets/${id}`;
  return `${DIRECTUS.replace(/\/$/, "")}/assets/${id}`;
}

/**
 * fetchHeroSlides - fetch all hero slider images and content
 */
export async function fetchHeroSlides(): Promise<HeroSlide[] | null> {
  try {
    if (!DIRECTUS || DIRECTUS === "undefined") return null;

    const url = new URL("/items/hero_slides", DIRECTUS).toString();
    const res = await axios.get(url, {
      params: { sort: "sort" },
      timeout: 5000,
    });
    return res?.data?.data ?? null;
  } catch (err: any) {
    console.error("Directus fetchHeroSlides error:", err.message);
    return null;
  }
}

/**
 * fetchCategories - fetch all main categories with their subcategories
 */
export async function fetchCategories(): Promise<Category[] | null> {
  try {
    if (!DIRECTUS || DIRECTUS === "undefined") return null;

    const url = new URL("/items/categories", DIRECTUS).toString();
    const res = await axios.get(url, {
      params: { 
        sort: "sort",
        fields: "*,subcategories.*"
      },
      timeout: 5000,
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
    if (!DIRECTUS || DIRECTUS === "undefined") return null;

    const url = new URL("/items/categories", DIRECTUS).toString();
    const res = await axios.get(url, {
      params: { 
        "filter[slug][_eq]": slug,
        fields: "*,subcategories.*",
        limit: 1
      },
      timeout: 5000,
    });
    return res?.data?.data?.[0] ?? null;
  } catch (err: any) {
    console.error("Directus fetchCategoryBySlug error:", err.message);
    return null;
  }
}
