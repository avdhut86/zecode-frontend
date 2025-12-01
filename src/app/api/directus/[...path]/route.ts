import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${DIRECTUS_URL}/${pathString}${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    const contentType = response.headers.get('content-type');

    // Handle assets/images and non-JSON responses
    if (path[0] === 'assets' || (contentType && !contentType.includes('application/json'))) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Cache-Control': response.headers.get('cache-control') || 'public, max-age=3600',
        },
      });
    }

    // Handle JSON responses
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Directus proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Directus' }, { status: 500 });
  }
}
