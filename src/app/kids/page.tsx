import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Define subcategories for Kids
const KIDS_SUBCATEGORIES = [
  { title: "Boys T-Shirts", slug: "boys-tshirts" },
  { title: "Girls Tops", slug: "girls-tops" },
  { title: "Boys Jeans", slug: "boys-jeans" },
  { title: "Girls Dresses", slug: "girls-dresses" },
  { title: "Jackets", slug: "jackets" },
  { title: "Shoes", slug: "shoes" },
];

export default async function KidsPage() {
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
        title="Kids" 
        categorySlug="kids"
        subcategories={KIDS_SUBCATEGORIES} 
      />
    </div>
  );
}
