// src/app/v3/page.tsx
// Parallax scrolling homepage - immersive experience with moving objects
"use client";

import { useEffect } from "react";
import Header from "@/components/v3/Header";
import Footer from "@/components/v3/Footer";
import ParallaxHome from "@/components/v3/ParallaxHome";

export default function HomeV3() {
  // Hide root layout's header and footer when V3 page is active
  useEffect(() => {
    document.body.classList.add('v3-active');
    
    return () => {
      document.body.classList.remove('v3-active');
    };
  }, []);

  return (
    <>
      <Header />
      <ParallaxHome />
      <Footer />
    </>
  );
}
