import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// Define subcategories for Women
const WOMEN_SUBCATEGORIES = [
  { title: "TOPS", slug: "tops" },
  { title: "DRESSES", slug: "dresses" },
  { title: "JEANS", slug: "jeans" },
  { title: "SKIRTS", slug: "skirts" },
  { title: "JACKETS", slug: "jackets" },
  { title: "SHOES", slug: "shoes" },
];

// Define specific slide for Women's category
const WOMEN_SLIDE = [
  {
    id: 1,
    image: "/categories/women.jpg",
    title: "WOMEN'S COLLECTION",
    subtitle: "Chic Styles • Elegant Dresses • Modern Essentials",
    cta: "SHOP WOMEN",
    link: "/women",
  }
];

export default function WomenPage() {
  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <HeroSlider slides={WOMEN_SLIDE} />
      <SubcategoryGridDynamic
        title="Women"
        categorySlug="women"
        subcategories={WOMEN_SUBCATEGORIES}
      />
    </div>
  );
}

