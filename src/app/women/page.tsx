import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Define subcategories for Women
const WOMEN_SUBCATEGORIES = [
  { title: "TOPS", slug: "tops" },
  { title: "DRESSES", slug: "dresses" },
  { title: "JEANS", slug: "jeans" },
  { title: "SKIRTS", slug: "skirts" },
  { title: "JACKETS", slug: "jackets" },
  { title: "SHOES", slug: "shoes" },
];

export default async function WomenPage() {
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
        title="Women" 
        categorySlug="women"
        subcategories={WOMEN_SUBCATEGORIES} 
      />
    </div>
  );
}
