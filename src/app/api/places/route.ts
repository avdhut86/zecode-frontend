import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Cache for place details (in-memory, resets on deploy)
const placeCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
    // Strict rate limiting for external API calls: 30 requests per minute
    const { allowed, headers } = checkRateLimit(request, { maxRequests: 30, windowMs: 60000 });
    
    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429, headers }
        );
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    const address = searchParams.get('address');
    const name = searchParams.get('name');

    if (!placeId && !address && !name) {
        return NextResponse.json(
            { error: 'Please provide placeId, address, or name' },
            { status: 400, headers }
        );
    }

    // Input validation
    const sanitize = (str: string | null) => str?.slice(0, 500).replace(/[<>]/g, '') || null;
    const sanitizedPlaceId = sanitize(placeId);
    const sanitizedAddress = sanitize(address);
    const sanitizedName = sanitize(name);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Google Places API key not configured' },
            { status: 500, headers }
        );
    }

    try {
        let finalPlaceId = sanitizedPlaceId;

        // Check cache first
        const cacheKey = finalPlaceId || sanitizedAddress || sanitizedName || '';
        const cached = placeCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data, { 
                headers: {
                    ...headers,
                    'X-Cache': 'HIT',
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                }
            });
        }

        // If no placeId provided, search for it using address or name
        if (!finalPlaceId && (sanitizedAddress || sanitizedName)) {
            const searchQuery = (sanitizedAddress || sanitizedName) as string;
            const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
            
            const searchResponse = await fetch(searchUrl, {
                next: { revalidate: 86400 } // Cache for 24 hours
            });
            const searchData = await searchResponse.json();

            if (searchData.status === 'OK' && searchData.candidates?.[0]?.place_id) {
                finalPlaceId = searchData.candidates[0].place_id;
            } else {
                return NextResponse.json(
                    { error: 'Place not found' },
                    { status: 404, headers }
                );
            }
        }

        // Fetch place details including reviews
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${finalPlaceId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,reviews,photos,geometry,url&key=${apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        const detailsData = await detailsResponse.json();

        if (detailsData.status === 'OK') {
            const responseData = {
                success: true,
                placeId: finalPlaceId,
                data: detailsData.result
            };

            // Store in cache
            placeCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

            // Cleanup old cache entries
            if (placeCache.size > 100) {
                const now = Date.now();
                for (const [key, value] of placeCache.entries()) {
                    if (now - value.timestamp > CACHE_TTL) {
                        placeCache.delete(key);
                    }
                }
            }

            return NextResponse.json(responseData, {
                headers: {
                    ...headers,
                    'X-Cache': 'MISS',
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                }
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to fetch place details' },
                { status: 500, headers }
            );
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers }
        );
    }
}
