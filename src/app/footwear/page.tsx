import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

// Define subcategories for Footwear - by gender
const FOOTWEAR_SUBCATEGORIES = [
  { title: "Men's Footwear", slug: "men" },
  { title: "Women's Footwear", slug: "women" },
];

// Define specific slide for Footwear category
const FOOTWEAR_SLIDE = [
  {
    id: 1,
    image: "/categories/footwear.jpg",
    title: "FOOTWEAR COLLECTION",
    subtitle: "Step Up Your Game • Premium Sneakers • Comfort First",
    cta: "SHOP FOOTWEAR",
    link: "/footwear",
  }
];

export default function FootwearPage() {
  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <HeroSlider slides={FOOTWEAR_SLIDE} />
      <SubcategoryGridDynamic
        title="Footwear"
        categorySlug="footwear"
        subcategories={FOOTWEAR_SUBCATEGORIES}
      />
    </div>
  );
}
