"use client";
import Image from "next/image";
import Link from "next/link";

const utilityLinks = [
  { href: "/lit-zone", label: "LIT ZONE" },
  { href: "/store-locator", label: "ZECODE NEAR YOU" },
  { href: "/about", label: "ABOUT" },
];

const categoryLinks = [
  { href: "/men", label: "MEN" },
  { href: "/women", label: "WOMEN" },
  { href: "/kids", label: "KIDS" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--brand-black)] text-white shadow-[0_15px_45px_rgba(0,0,0,0.6)]">
      <div className="bg-[var(--brand-red)] text-white text-[0.65rem] sm:text-xs tracking-[0.45em] uppercase text-center py-2 font-semibold">
        MY NEW FASHION CODE
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-3" aria-label="ZECODE home">
              <Image
                src="/brand/logo-full.svg"
                alt="ZECODE logo"
                width={170}
                height={40}
                priority
                className="h-10 w-auto"
              />
              <span className="hidden sm:block font-din text-xs tracking-[0.45em] text-white/70 uppercase">
                MY NEW FASHION CODE
              </span>
            </Link>

            <nav className="flex flex-wrap justify-end gap-4 sm:gap-8 font-din text-[0.6rem] sm:text-xs tracking-[0.45em] uppercase text-center">
              {utilityLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-white hover:text-[var(--brand-red)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <button
              className="md:hidden inline-flex flex-col gap-1 text-white"
              aria-label="Open menu"
            >
              <span className="block w-7 h-0.5 bg-white" />
              <span className="block w-7 h-0.5 bg-white" />
              <span className="block w-7 h-0.5 bg-white" />
            </button>
          </div>

          <div className="border-t border-white/15 pt-4">
            <nav className="flex items-center justify-center gap-8 sm:gap-12 font-din text-sm sm:text-base tracking-[0.4em] uppercase">
              {categoryLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-white hover:text-[var(--brand-red)] transition-colors px-2 pb-2"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
