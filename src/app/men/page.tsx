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
  { title: "Jackets", slug: "jackets" },
  { title: "Shoes", slug: "shoes" },
];

// Define specific slide for Men's category
const MEN_SLIDE = [
  {
    id: 1,
    image: "/categories/men.jpg",
    title: "MEN'S COLLECTION",
    subtitle: "Bold Streetwear • Casual Essentials • Urban Edge",
    cta: "SHOP MEN",
    link: "/men",
  }
];

export default function MenPage() {
  return (
    <div style={{ minHeight: "100%", backgroundColor: "#ffffff" }}>
      <HeroSlider slides={MEN_SLIDE} />
      <SubcategoryGridDynamic
        title="Men"
        categorySlug="men"
        subcategories={MEN_SUBCATEGORIES}
      />
    </div>
  );
}
