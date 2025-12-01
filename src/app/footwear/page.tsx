import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Define subcategories for Footwear - by gender
const FOOTWEAR_SUBCATEGORIES = [
  { title: "Men's Footwear", slug: "men" },
  { title: "Women's Footwear", slug: "women" },
];

export default async function FootwearPage() {
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
        title="Footwear" 
        categorySlug="footwear"
        subcategories={FOOTWEAR_SUBCATEGORIES} 
      />
    </div>
  );
}
