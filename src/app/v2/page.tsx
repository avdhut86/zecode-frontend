// src/app/v2/page.tsx
// Bold homepage design with enhanced visuals
"use client";

import { useEffect } from "react";
import Header from "@/components/v2/Header";
import Footer from "@/components/v2/Footer";
import HeroSlider from "@/components/v2/HeroSlider";

export default function HomeV2() {
  // Hide root layout's header and footer when V2 page is active
  useEffect(() => {
    // Add class to body to hide original header/footer via CSS
    document.body.classList.add('v2-active');
    
    return () => {
      document.body.classList.remove('v2-active');
    };
  }, []);

  return (
    <>
      {/* V2 Header - replaces original */}
      <div className="v2-header-wrapper" style={{ position: 'relative', zIndex: 100 }}>
        <Header />
      </div>
      
      {/* V2 Content */}
      <main className="bg-black min-h-screen">
        <HeroSlider />
      </main>
      
      {/* V2 Footer */}
      <Footer />
    </>
  );
}
