// src/lib/directus.ts
import axios from "axios";

const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";

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

/** fileUrl helper */
export function fileUrl(file: any) {
  if (!file) return null;
  const id = file?.id ?? file?.data?.id;
  if (!id) return null;
  if (!DIRECTUS || DIRECTUS === "undefined") return `/assets/${id}`;
  return `${DIRECTUS.replace(/\/$/, "")}/assets/${id}`;
}
