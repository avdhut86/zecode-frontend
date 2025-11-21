import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--brand-black)] text-white pt-16 pb-10 mt-12">
      <div className="h-2 bg-[var(--brand-red)] w-full mb-8" aria-hidden="true" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-6">
            <Link href="/" aria-label="ZECODE home" className="inline-flex flex-col gap-3">
              <Image
                src="/brand/logo-full.svg"
                alt="ZECODE"
                width={190}
                height={46}
                className="w-44 sm:w-48 h-auto"
              />
              <span className="text-[0.65rem] tracking-[0.45em] uppercase text-white/70">
                MY NEW FASHION CODE
              </span>
            </Link>
            <p className="text-sm text-gray-300 max-w-xs leading-relaxed">
              Find your fashion code @ZECODE — style edits that keep them guessing.
            </p>
          </div>

          <div>
            <h3 className="font-din text-lg tracking-[0.3em] uppercase mb-4">Categories</h3>
            <ul className="space-y-3 text-sm text-gray-400 tracking-[0.2em] uppercase">
              <li><Link href="/men" className="text-gray-400 hover:text-[var(--brand-red)] transition-colors">Men</Link></li>
              <li><Link href="/women" className="text-gray-400 hover:text-[var(--brand-red)] transition-colors">Women</Link></li>
              <li><Link href="/kids" className="text-gray-400 hover:text-[var(--brand-red)] transition-colors">Kids</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-din text-lg tracking-[0.3em] uppercase mb-4">Links</h3>
            <ul className="space-y-3 text-sm text-gray-400 tracking-[0.2em] uppercase">
              <li><Link href="/lit-zone" className="text-gray-400 hover:text-[var(--brand-red)] transition-colors">Lit Zone</Link></li>
              <li><Link href="/store-locator" className="text-gray-400 hover:text-[var(--brand-red)] transition-colors">Zecode Near You</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-[var(--brand-red)] transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-din text-lg tracking-[0.3em] uppercase mb-4">Follow Us</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { href: "https://www.facebook.com/zecode", label: "Facebook", icon: (
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                ) },
                { href: "https://twitter.com/zecode", label: "X (Twitter)", icon: (
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                ) },
                { href: "https://www.instagram.com/zecode", label: "Instagram", icon: (
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                ) },
                { href: "https://www.youtube.com/zecode", label: "YouTube", icon: (
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                ) },
                { href: "https://www.threads.net/@zecode", label: "Threads", icon: (
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142l-.126 1.974a11.881 11.881 0 0 0-2.588-.122c-1.066.061-1.94.38-2.6.948-.699.602-1.05 1.367-1.014 2.213.033.78.425 1.45 1.101 1.882.563.36 1.32.54 2.184.519 1.057-.058 1.956-.48 2.675-1.253.612-.657.986-1.49 1.112-2.477.023-.177.035-.355.035-.534 0-2.198-1.609-3.842-3.937-4.02-1.316-.1-2.518.15-3.57.744-1.224.69-2.13 1.846-2.622 3.344l-1.935-.498c.6-1.85 1.744-3.32 3.404-4.37 1.388-.877 3.011-1.31 4.82-1.287 3.228.024 5.882 2.157 6.483 5.208.344 1.748-.315 3.59-1.665 4.66-1.496 1.187-3.29 1.787-5.336 1.787z" />
                ) },
              ].map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:border-[var(--brand-red)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[0.65rem] sm:text-xs tracking-[0.4em] uppercase text-gray-400">
          <span>© {new Date().getFullYear()} ZECODE. All rights reserved.</span>
          <span>Find your fashion code @ZECODE</span>
        </div>
      </div>
    </footer>
  );
}
