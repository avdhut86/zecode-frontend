// src/app/layout.tsx
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchGlobalSettings } from "@/lib/directus";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "ZECODE - Your New Fashion Code",
    template: "%s | ZECODE",
  },
  description: "ZECODE - Premium kids fashion store in Bengaluru. Discover trendy, comfortable, and affordable clothing for children of all ages.",
  keywords: ["kids fashion", "children clothing", "Bengaluru", "kids wear", "ZECODE", "affordable kids clothes"],
  authors: [{ name: "ZECODE" }],
  creator: "ZECODE",
  publisher: "ZECODE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://zecode-frontend.vercel.app",
    siteName: "ZECODE",
    title: "ZECODE - Your New Fashion Code",
    description: "Premium kids fashion store in Bengaluru. Trendy, comfortable, and affordable clothing for children.",
    images: [
      {
        url: "/brand/zecode-og.png",
        width: 1200,
        height: 630,
        alt: "ZECODE - Kids Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZECODE - Your New Fashion Code",
    description: "Premium kids fashion store in Bengaluru.",
    images: ["/brand/zecode-og.png"],
  },
  verification: {
    google: "googleadc32a1f183a082d",
  },
  alternates: {
    canonical: "https://zecode-frontend.vercel.app",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch global settings from Directus (backend) with error handling
  let settings = null;
  try {
    settings = await fetchGlobalSettings();
  } catch (error) {
    console.error("Failed to fetch global settings:", error);
  }

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
          <Header />
          <main id="main" style={{ flex: '1 0 auto', backgroundColor: '#f5f5f5', width: '100%' }}>{children}</main>
          <Footer {...footerProps} />
        </ThemeProvider>
      </body>
    </html>
  );
}
