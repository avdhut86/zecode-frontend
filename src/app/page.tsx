import HeroSlider from "@/components/HeroSlider";
import CategoryGrid from "@/components/CategoryGrid";
import { MOCK_DATA } from "@/lib/mock-data";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSlider />
      <CategoryGrid />
    </div>
  );
}
