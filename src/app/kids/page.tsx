import HeroSlider from "@/components/HeroSlider";
import SubcategoryGridDynamic from "@/components/SubcategoryGridDynamic";
import { fetchHeroSlides } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

// Define subcategories for Kids
const KIDS_SUBCATEGORIES = [
  { title: "Boys T-Shirts", slug: "boys-tshirts" },
  { title: "Girls Tops", slug: "girls-tops" },
  { title: "Boys Jeans", slug: "boys-jeans" },
  { title: "Girls Dresses", slug: "girls-dresses" },
];

// Define specific slide for Kids' category
const KIDS_SLIDE = [
  {
    id: 1,
    image: "/categories/kids.jpg",
    title: "KIDS' COLLECTION",
    subtitle: "Playful Styles • Comfortable Fits • Fun Designs",
    cta: "SHOP KIDS",
    link: "/kids",
  }
];

export default function KidsPage() {
  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <HeroSlider slides={KIDS_SLIDE} />
      <SubcategoryGridDynamic
        title="Kids"
        categorySlug="kids"
        subcategories={KIDS_SUBCATEGORIES}
      />
    </div>
  );
}
