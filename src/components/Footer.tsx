// src/components/Footer.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  fetchFooterLinkGroups, 
  fetchFooterLinks, 
  fetchDirectusSocialLinks,
  fetchDirectusFooterSettings,
  fetchProductCounts,
  FooterLinkGroup,
  FooterLink,
  DirectusSocialLink,
  DirectusFooterSettings
} from "@/lib/directus";

// Mapping from URL slugs to CMS subcategory values for proper matching
const SLUG_TO_CMS_SUBCATEGORY: Record<string, string[]> = {
  // Men
  'tshirts': ['t', 'tshirt', 't-shirt'],
  'shirts': ['shirt'],
  'jeans': ['jean', 'jeans'],
  'trousers': ['trouser', 'trousers', 'pants', 'pant'],
  'jackets': ['jacket', 'outerwear'],
  'shoes': ['shoe', 'flats', 'flat'],
  // Women
  'tops': ['top', 'tops'],
  'dresses': ['dress', 'dresses'],
  'skirts': ['skirt', 'skirts'],
  // Kids - special mappings
  'boys-tshirts': ['t', 'tshirt', 't-shirt'],
  'girls-tops': ['top', 'tops'],
  'boys-jeans': ['bottom', 'bottoms', 'jean', 'jeans'],
  'girls-dresses': ['dress', 'dresses'],
  // Footwear - gender-based subcategories
  'men': ['flats', 'flat', 'mules', 'mule', 'sneakers', 'sneaker', 'boots', 'boot', 'loafers', 'loafer', 'sandals', 'sandal'],
  'women': ['flats', 'flat', 'mules', 'mule', 'heels', 'heel', 'sandals', 'sandal', 'boots', 'boot', 'sneakers', 'sneaker'],
};

// Social platform icon paths
const SOCIAL_ICONS: Record<string, string> = {
  facebook: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
  twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  instagram: "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
  youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  threads: "M16.3 8.5c-.3-.8-.8-1.5-1.4-2-.9-.7-2.1-1.1-3.4-1.1-1.9 0-3.4.7-4.5 2-.9 1.1-1.4 2.6-1.5 4.5h2.5c0-1.2.3-2.2.9-2.9.6-.7 1.5-1.1 2.6-1.1.7 0 1.3.2 1.8.5.4.3.7.7.9 1.2.2.5.3 1.1.3 1.7v.3c-.6-.3-1.3-.5-2.1-.5-1.6 0-2.9.5-3.8 1.4-.9.9-1.4 2.1-1.4 3.5s.5 2.6 1.4 3.5c.9.9 2.2 1.4 3.8 1.4.8 0 1.5-.1 2.1-.4.6-.3 1.1-.7 1.5-1.2.3-.4.5-.9.6-1.4h.1v2.4h2.4V12c0-1.3-.2-2.4-.7-3.5zm-3.8 9.6c-.9 0-1.6-.3-2.1-.8s-.8-1.2-.8-2c0-.8.3-1.5.8-2s1.2-.8 2.1-.8c.6 0 1.1.1 1.6.4.5.2.9.6 1.2 1 .3.4.4 1 .4 1.6 0 .8-.3 1.5-.8 2-.5.5-1.2.6-2.4.6z",
};

// Default fallback data
const DEFAULT_LINK_GROUPS = [
  { id: 1, title: "Categories", sort: 1 },
  { id: 2, title: "Quick Links", sort: 2 },
];

const DEFAULT_LINKS: FooterLink[] = [
  { id: 1, label: "Men", href: "/men", group: 1, sort: 1, status: "published" },
  { id: 2, label: "Women", href: "/women", group: 1, sort: 2, status: "published" },
  { id: 3, label: "Kids", href: "/kids", group: 1, sort: 3, status: "published" },
  { id: 7, label: "Footwear", href: "/footwear", group: 1, sort: 4, status: "published" },
  { id: 4, label: "About Us", href: "/about", group: 2, sort: 1, status: "published" },
  { id: 5, label: "Store Locator", href: "/store-locator-map", group: 2, sort: 2, status: "published" },
  { id: 6, label: "LIT ZONE", href: "/lit-zone", group: 2, sort: 3, status: "published" },
];

const DEFAULT_SOCIALS: DirectusSocialLink[] = [
  { id: 1, platform: "facebook", url: "https://www.facebook.com/zecodeindia", sort: 1, status: "published" },
  { id: 2, platform: "instagram", url: "https://www.instagram.com/zecodeindia", sort: 2, status: "published" },
  { id: 3, platform: "twitter", url: "https://x.com/zecodeindia", sort: 3, status: "published" },
  { id: 4, platform: "youtube", url: "https://www.youtube.com/@zecodeindia", sort: 4, status: "published" },
  { id: 5, platform: "threads", url: "https://www.threads.net/@zecodeindia", sort: 5, status: "published" },
];

const DEFAULT_FOOTER_SETTINGS: DirectusFooterSettings = {
  id: 1,
  copyright_text: "2025 ZECODE. All Rights Reserved.",
  newsletter_title: "Newsletter",
  newsletter_subtitle: "Get exclusive offers & updates",
  newsletter_enabled: true,
};

export default function Footer() {
  const { colors } = useTheme();
  const [linkGroups, setLinkGroups] = useState<FooterLinkGroup[]>(DEFAULT_LINK_GROUPS);
  const [links, setLinks] = useState<FooterLink[]>(DEFAULT_LINKS);
  const [socialLinks, setSocialLinks] = useState<DirectusSocialLink[]>(DEFAULT_SOCIALS);
  const [footerSettings, setFooterSettings] = useState<DirectusFooterSettings>(DEFAULT_FOOTER_SETTINGS);

  // Fetch footer data from CMS
  useEffect(() => {
    async function loadFooterData() {
      try {
        const [groups, footerLinks, socials, settings, counts] = await Promise.all([
          fetchFooterLinkGroups(),
          fetchFooterLinks(),
          fetchDirectusSocialLinks(),
          fetchDirectusFooterSettings(),
          fetchProductCounts(),
        ]);

        if (groups && groups.length > 0) setLinkGroups(groups);
        if (footerLinks && footerLinks.length > 0) {
          // If we have product counts, filter category links that have no products
          if (Array.isArray(counts) && counts.length > 0) {
            // Normalize CMS subcategory: lowercase, remove non-alphanum
            const normalizeCmsSub = (s?: string | null) => {
              if (!s) return "";
              return s.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
            };

            // Build a map of gender||normalizedSub -> count (only counts > 0)
            const countsByGenderSub = new Map<string, number>();
            const availableGenders = new Set<string>();
            counts.forEach(c => {
              const count = c.count || 0;
              if (count <= 0) return; // Skip subcategories with 0 products
              
              const gender = (c.gender_category || "").toString().toLowerCase();
              const sub = normalizeCmsSub(c.subcategory || "");
              const key = `${gender}||${sub}`;
              countsByGenderSub.set(key, (countsByGenderSub.get(key) || 0) + count);
              if (gender) availableGenders.add(gender);
            });

            // Helper to check if a link's subcategory has products
            const hasProducts = (gender: string, slug: string) => {
              const cmsMappings = SLUG_TO_CMS_SUBCATEGORY[slug] || [normalizeCmsSub(slug)];
              return cmsMappings.some(cmsVal => {
                const key = `${gender}||${cmsVal}`;
                return (countsByGenderSub.get(key) || 0) > 0;
              });
            };

            // Helper to check if footwear category has any products
            const hasFootwearProducts = () => {
              const footwearTypes = ['flats', 'flat', 'mules', 'mule', 'heels', 'heel', 'sandals', 'sandal', 'boots', 'boot', 'sneakers', 'sneaker', 'loafers', 'loafer'];
              const hasMensFootwear = footwearTypes.some(type => (countsByGenderSub.get(`men||${type}`) || 0) > 0);
              const hasWomensFootwear = footwearTypes.some(type => (countsByGenderSub.get(`women||${type}`) || 0) > 0);
              return hasMensFootwear || hasWomensFootwear;
            };

            const filtered = footerLinks.filter(link => {
              // Keep non-category quick links as-is
              if (!link.href.startsWith('/men') && !link.href.startsWith('/women') && !link.href.startsWith('/kids') && !link.href.startsWith('/footwear')) return true;

              // Special handling for footwear category
              if (link.href.startsWith('/footwear')) {
                return hasFootwearProducts();
              }

              // For top-level category links like '/men', '/women', '/kids' - use exact gender match
              const parts = link.href.split('/').filter(Boolean);
              const gender = (parts[0] || '').toLowerCase();
              if (parts.length === 1) {
                // Check if this gender has any products
                return availableGenders.has(gender);
              }

              // For deeper links like /men/tshirts, check using the slug mapping
              const slug = parts.slice(1).join('-');
              return hasProducts(gender, slug);
            });

            // Ensure Footwear link is always included if it has products
            const hasFootwearLink = filtered.some(link => link.href === '/footwear');
            let finalLinks = filtered;
            
            if (!hasFootwearLink && hasFootwearProducts()) {
              const defaultFootwearLink = DEFAULT_LINKS.find(link => link.href === '/footwear');
              if (defaultFootwearLink) {
                finalLinks = [...filtered, defaultFootwearLink];
              }
            }

            setLinks(finalLinks);
          } else {
            // No product counts - ensure Footwear is included
            const hasFootwearLink = footerLinks.some(link => link.href === '/footwear');
            if (!hasFootwearLink) {
              const defaultFootwearLink = DEFAULT_LINKS.find(link => link.href === '/footwear');
              if (defaultFootwearLink) {
                setLinks([...footerLinks, defaultFootwearLink]);
              } else {
                setLinks(footerLinks);
              }
            } else {
              setLinks(footerLinks);
            }
          }
        }
        if (socials && socials.length > 0) setSocialLinks(socials);
        if (settings) setFooterSettings(settings);
      } catch (error) {
        console.error("Failed to load footer data from CMS:", error);
        // Keep defaults on error
      }
    }
    loadFooterData();
  }, []);

  // Get links for a specific group
  const getLinksForGroup = (groupId: number) => {
    return links
      .filter(link => link.group === groupId)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  };

  // Get icon for social platform
  const getSocialIcon = (platform: string) => {
    return SOCIAL_ICONS[platform.toLowerCase()] || SOCIAL_ICONS.twitter;
  };

  return (
    <footer className="relative" style={{ backgroundColor: colors.footer.background, color: '#ffffff', width: '100%', flexShrink: 0, marginTop: 'auto' }}>
      {/* Top Accent Border */}
      <div className="h-[3px] bg-gradient-to-r from-[#C83232] via-[#e63946] to-[#C83232]"></div>

      {/* Main Footer Content */}
      <div className="relative z-10" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 32px 16px' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-6">
          {/* Dynamic Link Groups from CMS */}
          {linkGroups.slice(0, 2).map((group) => (
            <div key={group.id}>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {getLinksForGroup(group.id).map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                      {...(link.open_in_new_tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Third Column - Follow Us (Social Links from CMS) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white mb-2">
              Follow Us
            </h3>
            <div className="flex gap-2 flex-wrap">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C83232] flex items-center justify-center transition-all duration-300"
                >
                  <svg className="h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d={getSocialIcon(social.platform)} />
                  </svg>
                </a>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">Stay connected with us</p>
          </div>

          {/* Fourth Column - Newsletter (from CMS settings) */}
          {footerSettings.newsletter_enabled && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white mb-2">
                {footerSettings.newsletter_title || "Newsletter"}
              </h3>
              <p className="text-gray-500 text-xs mb-2">{footerSettings.newsletter_subtitle || "Get exclusive offers & updates"}</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-white/5 border border-white/10 rounded-l-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C83232] transition-colors"
                />
                <button className="bg-[#C83232] hover:bg-[#a82828] px-4 py-2 rounded-r-lg transition-colors text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          )}

          {/* Third link group (Support) if exists */}
          {linkGroups.length > 2 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white mb-2">
                {linkGroups[2].title}
              </h3>
              <ul className="space-y-1">
                {getLinksForGroup(linkGroups[2].id).map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                      {...(link.open_in_new_tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-8 py-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} {footerSettings.copyright_text || "ZECODE. All rights reserved."}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
