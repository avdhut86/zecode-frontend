"use client";

import { useEffect, useState } from "react";

interface PageHeaderProps {
    /** The page slug/key used to fetch title from Directus */
    pageKey: string;
    /** Default/fallback title if Directus fetch fails */
    defaultTitle: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Whether to show the red accent border */
    showAccent?: boolean;
}

/**
 * Uniform H1 Header Component
 * 
 * This component provides a consistent H1 styling across all pages.
 * It fetches the page title from Directus CMS, allowing backend editing.
 * Falls back to defaultTitle if Directus is unavailable.
 */
export default function PageHeader({ 
    pageKey, 
    defaultTitle, 
    subtitle,
    showAccent = true 
}: PageHeaderProps) {
    const [title, setTitle] = useState(defaultTitle);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTitle() {
            try {
                const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";
                const res = await fetch(`${DIRECTUS}/items/page_titles?filter[page_key][_eq]=${pageKey}&limit=1`);
                
                if (res.ok) {
                    const data = await res.json();
                    if (data?.data?.[0]?.title) {
                        setTitle(data.data[0].title);
                    }
                }
            } catch (error) {
                // Silently fail, use default title
                console.log(`Using default title for ${pageKey}`);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTitle();
    }, [pageKey]);

    return (
        <div className="relative overflow-hidden" style={{
            backgroundColor: 'transparent',
            padding: '20px 32px 16px',
            color: '#000000',
        }}>
            <div className="relative z-10" style={{
                maxWidth: '1400px',
                margin: '0 auto',
            }}>
                {/* Decorative Element */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-[2px] bg-gradient-to-r from-[#C83232] to-transparent"></div>
                    <div className="w-1.5 h-1.5 bg-[#C83232] rotate-45"></div>
                </div>
                
                <h1 className="relative" style={{
                    fontFamily: 'var(--font-din-condensed), "DIN Condensed", "League Gothic", system-ui, sans-serif',
                    fontSize: 'clamp(24px, 4vw, 32px)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    margin: '0',
                    color: '#000000',
                    opacity: isLoading ? 0.7 : 1,
                    transition: 'opacity 0.2s ease',
                }}>
                    {title}
                    {/* Underline accent */}
                    <span className="absolute -bottom-1 left-0 w-16 h-[2px] bg-gradient-to-r from-[#C83232] to-transparent"></span>
                </h1>
                
                {subtitle && (
                    <p className="mt-3 flex items-center gap-2" style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '12px',
                        color: 'rgba(0, 0, 0, 0.6)',
                        marginBottom: '0',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        <span className="inline-block w-3 h-[1px] bg-black/30"></span>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Server-side version for use in Server Components
 * Fetches title at build/request time
 */
export async function getPageTitle(pageKey: string, defaultTitle: string): Promise<string> {
    try {
        const DIRECTUS = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";
        const res = await fetch(
            `${DIRECTUS}/items/page_titles?filter[page_key][_eq]=${pageKey}&limit=1`,
            { next: { revalidate: 60 } } // Cache for 60 seconds
        );
        
        if (res.ok) {
            const data = await res.json();
            if (data?.data?.[0]?.title) {
                return data.data[0].title;
            }
        }
    } catch (error) {
        console.log(`Using default title for ${pageKey}`);
    }
    
    return defaultTitle;
}
