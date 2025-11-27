import HeroSlider from "@/components/HeroSlider";
import SubcategoryGrid from "@/components/SubcategoryGrid";
import { fetchCategoryBySlug, fetchHeroSlides } from "@/lib/directus";
import { MOCK_DATA } from "@/lib/mock-data";

export default async function MenPage() {
  // Try to fetch from Directus
  let category = null;
  let heroSlides = null;
  
  try {
    category = await fetchCategoryBySlug("men");
    heroSlides = await fetchHeroSlides();
  } catch (error) {
    console.error("Failed to fetch men category data:", error);
  }
  
  // Fallback to MOCK_DATA if Directus fails
  const menCategory = category || MOCK_DATA.categories.find(cat => cat.title === "MEN");
  
  if (!menCategory || !menCategory.subcategories) {
    return <div>Category not found</div>;
  }

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#ffffff' }}>
      <HeroSlider slides={heroSlides || undefined} />
      <SubcategoryGrid 
        title={menCategory.title} 
        subcategories={menCategory.subcategories} 
      />
    </div>
  );
}
