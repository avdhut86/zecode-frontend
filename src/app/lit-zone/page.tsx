// src/app/lit-zone/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

/**
 * Lit Zone page
 *
 * - Fetches from /api/instagram/latest (server side) to keep tokens secret
 * - Allows manual additions stored in localStorage (loading only, management UI removed)
 * - Responsive, accessible grid
 */

type Reel = {
  id: string;
  title?: string;
  caption?: string;
  media_type?: string;
  media_url?: string | null;
  thumbnail_url?: string | null;
  permalink?: string | null;
  timestamp?: string | null;
  source?: "manual" | "import";
};

const LOCAL_KEY = "litzone_manual_reels_v1";

function formatDate(ts?: string | null) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function LitZonePage() {
  const [items, setItems] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load manual items from localStorage and keep them first
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const manual: Reel[] = raw ? JSON.parse(raw) : [];
      // ensure we render manual first, then nothing else yet
      setItems(manual.map((m) => ({ ...m, source: "manual" })));
    } catch {
      setItems([]);
    }
  }, []);

  // Fetch from our server API which proxies IG. This keeps tokens secure.
  async function fetchLatest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/instagram/latest");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Fetch failed (${res.status})`);
      }
      const json = await res.json();

      // Check if API returned a message (e.g., credentials not configured)
      if (json.message) {
        setError(json.message);
        return;
      }

      const data = Array.isArray(json.data) ? json.data : json;
      // normalize items from IG
      const imported: Reel[] = (data || []).map((m: any) => ({
        id: `ig_${m.id}`,
        title: m.caption ? (m.caption.length > 80 ? m.caption.slice(0, 80) + "…" : m.caption) : "Instagram",
        caption: m.caption || "",
        media_type: m.media_type,
        media_url: m.media_url || null,
        thumbnail_url: m.thumbnail_url || m.media_url || null,
        permalink: m.permalink || null,
        timestamp: m.timestamp || null,
        source: "import",
      }));

      // merge: manual items (from localStorage) should remain at top; dedupe imported against existing ids
      const rawManual = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as Reel[];
      const manualFirst = (rawManual || []).map((m) => ({ ...m, source: "manual" as const }));
      const existingIds = new Set(manualFirst.map((m) => m.id));
      const filteredImported = imported.filter((imp) => !existingIds.has(imp.id));
      setItems([...manualFirst, ...filteredImported]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch latest");
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch on mount
  useEffect(() => {
    fetchLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-black">
      {/* HEADER */}
      <PageHeader pageKey="lit-zone" defaultTitle="LIT ZONE" subtitle="Curated reels and edits from our Instagram" />

      {/* FEED */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12">
        {error && (
          <div className={`mb-6 px-4 py-3 rounded ${error.includes("not configured")
            ? "bg-blue-100 border border-blue-300 text-blue-800"
            : "bg-red-100 border border-red-300 text-red-800"
            }`}>
            <strong className="mr-2">{error.includes("not configured") ? "Info:" : "Error:"}</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-gray-500">Loading latest reels…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No reels yet.</div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {items.map((it) => (
              <article
                key={it.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#C83232] hover:shadow-xl hover:shadow-[#C83232]/10 transition-all duration-300 group"
                aria-labelledby={`title-${it.id}`}
              >
                <a
                  href={it.permalink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative w-full"
                  style={{ paddingBottom: '100%' }}
                >
                  <img
                    src={it.thumbnail_url || it.media_url || "/placeholders/hero-default.jpg"}
                    alt={it.caption ? it.caption.slice(0, 120) : it.title || "Instagram Reel"}
                    className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Play icon overlay for video content */}
                  {it.media_type === "VIDEO" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </a>

                <div className="p-4 bg-white">
                  <h3 id={`title-${it.id}`} className="text-sm font-semibold text-black line-clamp-2 min-h-[2.5rem]">
                    {it.title || (it.caption ? it.caption.slice(0, 100) : "Instagram Post")}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(it.timestamp)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      it.source === "manual" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-pink-100 text-pink-700"
                    }`}>
                      {it.source === "manual" ? "Manual" : "Instagram"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
