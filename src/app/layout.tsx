// src/app/layout.tsx
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchGlobalSettings, fileUrl } from "@/lib/directus";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Zecode - Urban Fashion Code",
  description: "Zecode store - Find your fashion code",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch global settings from Directus (backend) with error handling
  let settings = null;
  try {
    settings = await fetchGlobalSettings();
  } catch (error) {
    console.error("Failed to fetch global settings:", error);
  }

  // Prepare props for Header
  const headerProps = {
    utilityLinks: settings?.header_nav?.slice(0, 3) || undefined, // Use first 3 or default
    categoryLinks: settings?.header_nav?.slice(3) || undefined,   // Use rest or default (adjust logic as needed)
    logoUrl: settings?.site_logo ? fileUrl(settings.site_logo) : null,
  };

  // Prepare props for Footer
  const footerProps = {
    footerLinks: settings?.footer_nav || undefined,
    socialLinks: settings?.social_links || undefined,
    footerText: settings?.footer_text || undefined,
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="antialiased" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', margin: 0, padding: 0 }}>
        <ThemeProvider>
          <a className="sr-only focus:not-sr-only p-2 absolute z-[9999]" href="#main">
            Skip to content
          </a>
          <Header {...headerProps} />
          <main id="main" style={{ flex: '1 0 auto', backgroundColor: '#f5f5f5', width: '100%' }}>{children}</main>
          <Footer {...footerProps} />
        </ThemeProvider>
      </body>
    </html>
  );
}
