import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

// Define subcategories for Men
const MEN_SUBCATEGORIES = [
  { title: "T-Shirts", slug: "tshirts" },
  { title: "Shirts", slug: "shirts" },
  { title: "Jeans", slug: "jeans" },
  { title: "Trousers", slug: "trousers" },
  { title: "Jackets", slug: "jackets" },
  { title: "Shoes", slug: "shoes" },
];

export default async function MenPage() {
  let heroSlides = null;
  
  try {
    heroSlides = await fetchHeroSlides();
  } catch (error) {
    console.error("Failed to fetch hero slides:", error);
  }

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <HeroSlider slides={heroSlides || undefined} />
      <SubcategoryGridDynamic 
        title="Men" 
        categorySlug="men"
        subcategories={MEN_SUBCATEGORIES} 
      />
    </div>
  );
}
