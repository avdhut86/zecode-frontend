// src/components/Footer.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

type LinkItem = { label: string; href: string };
type SocialItem = { label: string; href: string; icon?: string };

type Props = {
  footerLinks?: LinkItem[];
  socialLinks?: SocialItem[];
  footerText?: string;
};

const DEFAULT_FOOTER_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/store-locator-map", label: "Store Locator" },
  { href: "/lit-zone", label: "LIT ZONE" },
];

const DEFAULT_SOCIALS = [
  {
    href: "https://www.facebook.com/zecodeindia",
    label: "Facebook",
    icon: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
  },
  {
    href: "https://x.com/zecodeindia",
    label: "X (Twitter)",
    icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    href: "https://www.instagram.com/zecodeindia",
    label: "Instagram",
    icon: "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
  },
  {
    href: "https://www.youtube.com/@zecodeindia",
    label: "YouTube",
    icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    href: "https://www.threads.net/@zecodeindia",
    label: "Threads",
    icon: "M16.3 8.5c-.3-.8-.8-1.5-1.4-2-.9-.7-2.1-1.1-3.4-1.1-1.9 0-3.4.7-4.5 2-.9 1.1-1.4 2.6-1.5 4.5h2.5c0-1.2.3-2.2.9-2.9.6-.7 1.5-1.1 2.6-1.1.7 0 1.3.2 1.8.5.4.3.7.7.9 1.2.2.5.3 1.1.3 1.7v.3c-.6-.3-1.3-.5-2.1-.5-1.6 0-2.9.5-3.8 1.4-.9.9-1.4 2.1-1.4 3.5s.5 2.6 1.4 3.5c.9.9 2.2 1.4 3.8 1.4.8 0 1.5-.1 2.1-.4.6-.3 1.1-.7 1.5-1.2.3-.4.5-.9.6-1.4h.1v2.4h2.4V12c0-1.3-.2-2.4-.7-3.5zm-3.8 9.6c-.9 0-1.6-.3-2.1-.8s-.8-1.2-.8-2c0-.8.3-1.5.8-2s1.2-.8 2.1-.8c.6 0 1.1.1 1.6.4.5.2.9.6 1.2 1 .3.4.4 1 .4 1.6 0 .8-.3 1.5-.8 2-.5.5-1.2.6-2.4.6z",
  },
];

export default function Footer({
  footerLinks = DEFAULT_FOOTER_LINKS,
  socialLinks = DEFAULT_SOCIALS,
  footerText,
}: Props) {
  const { colors } = useTheme();

  return (
    <footer className="relative" style={{ backgroundColor: colors.footer.background, color: '#ffffff', width: '100%', flexShrink: 0, marginTop: 'auto' }}>
      {/* Top Accent Border */}
      <div className="h-[3px] bg-gradient-to-r from-[#C83232] via-[#e63946] to-[#C83232]"></div>

      {/* Main Footer Content */}
      <div className="relative z-10" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 32px 16px' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-6">
          {/* First Column - Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white mb-2">
              Categories
            </h3>
            <ul className="space-y-1">
              {[
                { href: "/men", label: "Men" },
                { href: "/women", label: "Women" },
                { href: "/kids", label: "Kids" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Second Column - Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white mb-2">
              Quick Links
            </h3>
            <ul className="space-y-1">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Third Column - Follow Us */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white mb-2">
              Follow Us
            </h3>
            <div className="flex gap-2 flex-wrap">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C83232] flex items-center justify-center transition-all duration-300"
                >
                  {social.icon && (
                    <svg className="h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  )}
                </a>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">Stay connected with us</p>
          </div>

          {/* Fourth Column - Newsletter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white mb-2">
              Newsletter
            </h3>
            <p className="text-gray-500 text-xs mb-2">Get exclusive offers & updates</p>
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
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-8 py-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} ZECODE. All rights reserved.
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
