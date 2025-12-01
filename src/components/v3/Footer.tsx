// src/components/v3/Footer.tsx
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  fetchDirectusNavigation, 
  fetchDirectusSocialLinks,
  fetchDirectusFooterSettings,
  DirectusNavigationItem,
  DirectusSocialLink,
  DirectusFooterSettings
} from "@/lib/directus";

/**
 * FooterV3 - Minimal Footer for Parallax Experience
 * Warm, Earthy Color Scheme
 */

// V3 Color Palette - Warm Tones
const V3_COLORS = {
  background: '#F5F1ED',
  backgroundDark: '#E8E2DB',
  text: '#2D2926',
  textLight: '#6B635B',
  accent: '#C4704C',
  accentHover: '#A85A3A',
  highlight: '#8B7355',
};

type LinkItem = { href: string; label: string };

const DEFAULT_LINKS: LinkItem[] = [
  { href: "/men", label: "MEN" },
  { href: "/women", label: "WOMEN" },
  { href: "/kids", label: "KIDS" },
  { href: "/store-locator-map", label: "STORES" },
  { href: "/about", label: "ABOUT" },
];

const DEFAULT_SOCIAL: DirectusSocialLink[] = [
  { id: 1, platform: "instagram", url: "https://instagram.com/zecodeindia", sort: 1, status: "published" },
  { id: 2, platform: "facebook", url: "https://facebook.com/zecodeindia", sort: 2, status: "published" },
  { id: 3, platform: "youtube", url: "https://youtube.com/@zecodeindia", sort: 3, status: "published" },
];

const DEFAULT_FOOTER_SETTINGS: DirectusFooterSettings = {
  id: 1,
  copyright_text: "ZECODE. All rights reserved.",
};

export default function Footer() {
  const [links, setLinks] = useState<LinkItem[]>(DEFAULT_LINKS);
  const [socialLinks, setSocialLinks] = useState<DirectusSocialLink[]>(DEFAULT_SOCIAL);
  const [footerSettings, setFooterSettings] = useState<DirectusFooterSettings>(DEFAULT_FOOTER_SETTINGS);

  // Fetch data from CMS
  useEffect(() => {
    async function loadFooterData() {
      try {
        const [navItems, socials, settings] = await Promise.all([
          fetchDirectusNavigation(),
          fetchDirectusSocialLinks(),
          fetchDirectusFooterSettings(),
        ]);

        if (navItems && navItems.length > 0) {
          const processedLinks = navItems
            .filter((item: DirectusNavigationItem) => item.parent === null)
            .sort((a: DirectusNavigationItem, b: DirectusNavigationItem) => (a.sort || 0) - (b.sort || 0))
            .map((item: DirectusNavigationItem) => ({
              href: item.href,
              label: item.label.toUpperCase(),
            }));
          if (processedLinks.length > 0) setLinks(processedLinks);
        }

        if (socials && socials.length > 0) setSocialLinks(socials);
        if (settings) setFooterSettings(settings);
      } catch (error) {
        console.error("Failed to load footer data from CMS:", error);
      }
    }
    loadFooterData();
  }, []);

  return (
    <footer 
      className="py-16 md:py-24"
      style={{ 
        backgroundColor: V3_COLORS.text,
        borderTop: `1px solid ${V3_COLORS.highlight}`
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div>
            <Link href="/v3" className="inline-block mb-6">
              <img 
                src="/brand/logo-full.svg" 
                alt="ZECODE" 
                className="h-10 md:h-12 w-auto brightness-0 invert"
              />
            </Link>
            <p 
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: V3_COLORS.backgroundDark, opacity: 0.7 }}
            >
              Curated fashion for every story. 50+ stores across India.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 
              className="text-xs tracking-[0.3em] uppercase mb-6"
              style={{ color: V3_COLORS.highlight }}
            >
              Explore
            </h4>
            <nav className="flex flex-col gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: V3_COLORS.backgroundDark }}
                  onMouseEnter={(e) => e.currentTarget.style.color = V3_COLORS.accent}
                  onMouseLeave={(e) => e.currentTarget.style.color = V3_COLORS.backgroundDark}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div>
            <h4 
              className="text-xs tracking-[0.3em] uppercase mb-6"
              style={{ color: V3_COLORS.highlight }}
            >
              Connect
            </h4>
            <nav className="flex flex-col gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: V3_COLORS.backgroundDark }}
                  onMouseEnter={(e) => e.currentTarget.style.color = V3_COLORS.accent}
                  onMouseLeave={(e) => e.currentTarget.style.color = V3_COLORS.backgroundDark}
                >
                  {social.platform.toUpperCase()}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div 
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: `1px solid ${V3_COLORS.highlight}40` }}
        >
          <p 
            className="text-xs"
            style={{ color: V3_COLORS.backgroundDark, opacity: 0.5 }}
          >
            © {new Date().getFullYear()} {footerSettings.copyright_text || "ZECODE. All rights reserved."}
          </p>
          <p 
            className="text-xs"
            style={{ color: V3_COLORS.backgroundDark, opacity: 0.4 }}
          >
            50+ Stores Across India
          </p>
        </div>
      </div>
    </footer>
  );
}
