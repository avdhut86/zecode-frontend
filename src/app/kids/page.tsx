import HeroSlider from "@/components/HeroSlider";
import SubcategoryGrid from "@/components/SubcategoryGrid";
import { fetchCategoryBySlug, fetchHeroSlides } from "@/lib/directus";
import { MOCK_DATA } from "@/lib/mock-data";

export default async function KidsPage() {
  // Try to fetch from Directus
  let category = null;
  let heroSlides = null;
  
  try {
    category = await fetchCategoryBySlug("kids");
    heroSlides = await fetchHeroSlides();
  } catch (error) {
    console.error("Failed to fetch kids category data:", error);
  }
  
  // Fallback to MOCK_DATA if Directus fails
  const kidsCategory = category || MOCK_DATA.categories.find(cat => cat.title === "KIDS");
  
  if (!kidsCategory || !kidsCategory.subcategories) {
    return <div>Category not found</div>;
  }

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#ffffff' }}>
      <HeroSlider slides={heroSlides || undefined} />
      <SubcategoryGrid 
        title={kidsCategory.title} 
        subcategories={kidsCategory.subcategories} 
      />
    </div>
  );
}
