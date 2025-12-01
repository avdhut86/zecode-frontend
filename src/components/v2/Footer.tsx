// src/components/v2/Footer.tsx
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  fetchFooterLinkGroups, 
  fetchFooterLinks, 
  fetchDirectusSocialLinks,
  fetchDirectusFooterSettings,
  FooterLinkGroup,
  FooterLink,
  DirectusSocialLink,
  DirectusFooterSettings
} from "@/lib/directus";

/**
 * FooterV2 - Bold Footer Design
 * Navy Blue & Gold Color Scheme
 */

// V2 Color Palette - Navy & Gold
const V2_COLORS = {
  primary: '#1a2744',
  primaryLight: '#2a3a5c',
  secondary: '#c9a227',
  secondaryLight: '#dbb44a',
  text: '#ffffff',
  textMuted: '#a8b2c4',
  accent: '#e8b923',
};

// Social icons for each platform
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  threads: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.856-.71 2.053-1.133 3.39-1.26 1.036-.096 2.082-.036 3.075.153-.007-.334-.036-.67-.09-1.004-.22-1.322-.749-2.31-1.487-2.78-.713-.453-1.643-.546-2.645-.272l-.554-1.926c1.471-.4 2.874-.273 3.994.362 1.19.673 2.022 1.882 2.38 3.479.089.396.153.81.194 1.236.892.282 1.724.667 2.456 1.163a6.338 6.338 0 0 1 2.138 2.4c.744 1.69.9 4.273-1.28 6.406-1.834 1.792-4.164 2.662-7.32 2.682l-.004.002ZM11.93 18.99l.015-.002c1.062-.066 1.873-.455 2.412-1.158.438-.57.723-1.338.857-2.302-.724-.142-1.489-.205-2.245-.189-1.022.069-1.878.345-2.416.781-.442.358-.657.81-.622 1.306.035.496.32.973.8 1.345.561.434 1.304.632 2.143.632.351 0 .716-.035 1.079-.107l-.023-.307Z" />
    </svg>
  ),
};

// Default data
const DEFAULT_LINK_GROUPS: FooterLinkGroup[] = [
  { id: 1, title: "Categories", sort: 1 },
  { id: 2, title: "Quick Links", sort: 2 },
];

const DEFAULT_LINKS: FooterLink[] = [
  { id: 1, label: "MEN", href: "/men", group: 1, sort: 1, status: "published" },
  { id: 2, label: "WOMEN", href: "/women", group: 1, sort: 2, status: "published" },
  { id: 3, label: "KIDS", href: "/kids", group: 1, sort: 3, status: "published" },
  { id: 4, label: "ABOUT US", href: "/about", group: 2, sort: 1, status: "published" },
  { id: 5, label: "STORE LOCATOR", href: "/store-locator-map", group: 2, sort: 2, status: "published" },
  { id: 6, label: "LIT ZONE", href: "/lit-zone", group: 2, sort: 3, status: "published" },
];

const DEFAULT_SOCIALS: DirectusSocialLink[] = [
  { id: 1, platform: "facebook", url: "https://www.facebook.com/zecodeindia", sort: 1, status: "published" },
  { id: 2, platform: "instagram", url: "https://www.instagram.com/zecodeindia", sort: 2, status: "published" },
  { id: 3, platform: "twitter", url: "https://twitter.com/zecodeindia", sort: 3, status: "published" },
  { id: 4, platform: "youtube", url: "https://www.youtube.com/@zecodeindia", sort: 4, status: "published" },
  { id: 5, platform: "threads", url: "https://www.threads.net/@zecodeindia", sort: 5, status: "published" },
];

const DEFAULT_FOOTER_SETTINGS: DirectusFooterSettings = {
  id: 1,
  copyright_text: "2025 ZECODE. All Rights Reserved.",
  newsletter_title: "JOIN THE ZECODE COMMUNITY",
  newsletter_subtitle: "Get exclusive drops, offers and early access to new collections.",
  newsletter_enabled: true,
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [linkGroups, setLinkGroups] = useState<FooterLinkGroup[]>(DEFAULT_LINK_GROUPS);
  const [links, setLinks] = useState<FooterLink[]>(DEFAULT_LINKS);
  const [socialLinks, setSocialLinks] = useState<DirectusSocialLink[]>(DEFAULT_SOCIALS);
  const [footerSettings, setFooterSettings] = useState<DirectusFooterSettings>(DEFAULT_FOOTER_SETTINGS);

  // Fetch data from CMS
  useEffect(() => {
    async function loadFooterData() {
      try {
        const [groups, footerLinks, socials, settings] = await Promise.all([
          fetchFooterLinkGroups(),
          fetchFooterLinks(),
          fetchDirectusSocialLinks(),
          fetchDirectusFooterSettings(),
        ]);

        if (groups && groups.length > 0) setLinkGroups(groups);
        if (footerLinks && footerLinks.length > 0) setLinks(footerLinks);
        if (socials && socials.length > 0) setSocialLinks(socials);
        if (settings) setFooterSettings(settings);
      } catch (error) {
        console.error("Failed to load footer data from CMS:", error);
      }
    }
    loadFooterData();
  }, []);

  const getLinksForGroup = (groupId: number) => {
    return links
      .filter(link => link.group === groupId)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  };

  const getSocialIcon = (platform: string) => {
    return SOCIAL_ICONS[platform.toLowerCase()] || SOCIAL_ICONS.twitter;
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative overflow-hidden" style={{ backgroundColor: V2_COLORS.primary, color: V2_COLORS.text }}>
      {/* Gradient Top Border */}
      <div 
        className="h-1" 
        style={{ background: `linear-gradient(90deg, ${V2_COLORS.secondary}, ${V2_COLORS.accent}, ${V2_COLORS.secondary})` }}
      />

      {/* Main Footer Content */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/v2" className="inline-block group">
              <img 
                src="/brand/logo-full.svg" 
                alt="ZECODE" 
                className="h-10 md:h-12 w-auto brightness-0 invert mb-4"
              />
              <div 
                className="w-12 h-1 group-hover:w-full transition-all duration-500"
                style={{ backgroundColor: V2_COLORS.secondary }}
              />
            </Link>
            <p className="mt-6 leading-relaxed" style={{ color: V2_COLORS.textMuted }}>
              Bold fashion for those who dare to stand out. Visit our 50+ stores across India for the latest collections.
            </p>
          </div>

          {/* Dynamic Link Groups from CMS */}
          {linkGroups.slice(0, 2).map((group) => (
            <div key={group.id}>
              <h3 
                className="text-xs font-bold tracking-[0.3em] uppercase mb-6"
                style={{ color: V2_COLORS.textMuted }}
              >
                {group.title.toUpperCase()}
              </h3>
              <ul className="space-y-4">
                {getLinksForGroup(group.id).map((link) => (
                  <li key={link.id}>
                    <Link 
                      href={link.href} 
                      className="group flex items-center gap-2 text-lg font-semibold transition-colors duration-300"
                      style={{ color: V2_COLORS.textMuted }}
                      onMouseEnter={(e) => e.currentTarget.style.color = V2_COLORS.text}
                      onMouseLeave={(e) => e.currentTarget.style.color = V2_COLORS.textMuted}
                    >
                      <span 
                        className="w-0 h-0.5 group-hover:w-4 transition-all duration-300"
                        style={{ backgroundColor: V2_COLORS.secondary }}
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h3 
              className="text-xs font-bold tracking-[0.3em] uppercase mb-6"
              style={{ color: V2_COLORS.textMuted }}
            >
              {footerSettings.newsletter_title || "NEWSLETTER"}
            </h3>
            <p className="mb-6" style={{ color: V2_COLORS.textMuted }}>
              {footerSettings.newsletter_subtitle || "Be the first to know about new collections and exclusive offers."}
            </p>
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-none px-4 py-4 focus:outline-none transition-colors duration-300"
                style={{ 
                  backgroundColor: `${V2_COLORS.primaryLight}`,
                  border: `1px solid ${V2_COLORS.secondary}30`,
                  color: V2_COLORS.text
                }}
                required
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-6 transition-colors duration-300 font-bold tracking-wider"
                style={{ backgroundColor: V2_COLORS.secondary, color: V2_COLORS.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = V2_COLORS.accent}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = V2_COLORS.secondary}
              >
                {isSubscribed ? "✓" : "→"}
              </button>
            </form>
            {isSubscribed && (
              <p 
                className="mt-3 text-sm font-semibold animate-pulse"
                style={{ color: V2_COLORS.secondary }}
              >
                Thanks for subscribing!
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div 
          className="my-12 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${V2_COLORS.secondary}30, transparent)` }}
        />

        {/* Social Links & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-12 h-12 flex items-center justify-center transition-all duration-300"
                style={{ 
                  border: `1px solid ${V2_COLORS.secondary}30`,
                  backgroundColor: V2_COLORS.primaryLight
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = V2_COLORS.secondary;
                  e.currentTarget.style.backgroundColor = V2_COLORS.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${V2_COLORS.secondary}30`;
                  e.currentTarget.style.backgroundColor = V2_COLORS.primaryLight;
                }}
                aria-label={social.platform}
              >
                <span 
                  className="group-hover:text-white transition-colors duration-300"
                  style={{ color: V2_COLORS.textMuted }}
                >
                  {getSocialIcon(social.platform)}
                </span>
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm" style={{ color: V2_COLORS.textMuted }}>
              © {new Date().getFullYear()} {footerSettings.copyright_text || "ZECODE. All rights reserved."}
            </p>
            <p className="text-xs mt-1" style={{ color: `${V2_COLORS.textMuted}80` }}>
              50+ Stores Across India
            </p>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div 
          className="absolute bottom-0 right-0 text-[40vw] font-black leading-none select-none" 
          style={{ fontFamily: '"DIN Condensed", Impact, sans-serif', color: `${V2_COLORS.text}10` }}
        >
          Z
        </div>
      </div>
    </footer>
  );
}
