import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

// Cache durations for different resource types
const CACHE_DURATIONS: Record<string, number> = {
  'products': 300,      // 5 minutes
  'hero_slides': 600,   // 10 minutes
  'stores': 1800,       // 30 minutes
  'categories': 600,    // 10 minutes
  'assets': 86400,      // 24 hours for images
  'default': 60,        // 1 minute default
};

function getCacheDuration(pathString: string): number {
  for (const [key, duration] of Object.entries(CACHE_DURATIONS)) {
    if (pathString.includes(key)) {
      return duration;
    }
  }
  return CACHE_DURATIONS.default;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${DIRECTUS_URL}/${pathString}${searchParams ? `?${searchParams}` : ''}`;
    
    const cacheDuration = getCacheDuration(pathString);

    const response = await fetch(url, {
      next: { revalidate: cacheDuration },
    });

    const contentType = response.headers.get('content-type');

    // Handle assets/images and non-JSON responses
    if (path[0] === 'assets' || (contentType && !contentType.includes('application/json'))) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Cache-Control': `public, max-age=${CACHE_DURATIONS.assets}, stale-while-revalidate=${CACHE_DURATIONS.assets * 2}`,
        },
      });
    }

    // Handle JSON responses with stale-while-revalidate
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, max-age=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`,
      },
    });
  } catch (error) {
    console.error('Directus proxy error:', error);
    // Return error with short cache to allow retry
    return NextResponse.json(
      { error: 'Failed to fetch from Directus', data: null }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
