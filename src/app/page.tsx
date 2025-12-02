import HeroSlider from "@/components/HeroSlider";
import { fetchHeroSlides } from "@/lib/directus";

// Use ISR - revalidate every 5 minutes for fresh content without cold starts
export const revalidate = 300;

export default async function Home() {
  // Fetch data from Directus (with error handling)
  let heroSlides = null;
  
  try {
    heroSlides = await fetchHeroSlides();
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
  }

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffff', minHeight: '100%' }}>
      <HeroSlider slides={heroSlides || undefined} />
    </div>
  );
}
