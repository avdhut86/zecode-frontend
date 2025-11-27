// src/app/api/instagram/latest/route.ts
import { NextResponse } from "next/server";

const IG_USER_ID = process.env.IG_USER_ID;        // e.g. 26112763951657137
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN; // your IG token (keep secret)

if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
  console.warn("Missing IG_USER_ID or IG_ACCESS_TOKEN env vars");
}

/** Simple in-memory cache */
let cache: { ts: number; data: any } | null = null;
const TTL = 1000 * 60 * 5; // 5 minutes

async function fetchInstagram() {
  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
  ].join(",");

  // Use the graph.instagram.com endpoint you successfully tested
  const url = `https://graph.instagram.com/${IG_USER_ID}/media?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(IG_ACCESS_TOKEN!)}&limit=50`;

  // Note: In development, if you encounter SSL certificate errors (SELF_SIGNED_CERT_IN_CHAIN),
  // you may need to set NODE_TLS_REJECT_UNAUTHORIZED=0 in your environment
  // This is NOT recommended for production!
  const res = await fetch(url, {
    // @ts-ignore - Next.js fetch doesn't have this in types but Node.js does
    agent: process.env.NODE_ENV === 'development' ? undefined : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`Instagram API error ${res.status}:`, txt);
    throw new Error(`Instagram API error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  console.log(`Successfully fetched ${json.data?.length || 0} items from Instagram`);
  return json.data || [];
}

export async function GET() {
  try {
    // Check if credentials are configured
    if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
      return NextResponse.json({
        data: [],
        message: "Instagram API credentials not configured. Please set IG_USER_ID and IG_ACCESS_TOKEN environment variables."
      });
    }

    if (cache && Date.now() - cache.ts < TTL) {
      return NextResponse.json({ fromCache: true, data: cache.data });
    }

    let data;
    try {
      data = await fetchInstagram();
    } catch (fetchError: any) {
      console.error("Instagram fetch error:", fetchError);
      return NextResponse.json({
        error: fetchError.message || "Failed to fetch from Instagram",
        details: fetchError.toString()
      }, { status: 500 });
    }

    // Basic normalization: ensure thumbnail present
    const normalized = data.map((item: any) => ({
      id: item.id,
      caption: item.caption || "",
      media_type: item.media_type,
      media_url: item.media_url || null,
      thumbnail_url: item.thumbnail_url || item.media_url || null,
      permalink: item.permalink || null,
      timestamp: item.timestamp || null,
    }));

    cache = { ts: Date.now(), data: normalized };
    return NextResponse.json({ fromCache: false, data: normalized });
  } catch (err: any) {
    console.error("Unexpected error in Instagram API route:", err);
    return NextResponse.json({
      error: err.message || "Unknown error",
      details: err.toString()
    }, { status: 500 });
  }
}
