import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

  try {
    const response = await fetch(`${directusUrl}/assets/${id}`);

    if (!response.ok) {
      return new NextResponse('Asset not found', { status: 404 });
    }

    const blob = await response.blob();
    const headers = new Headers();

    // Copy content type and other headers
    response.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    return new NextResponse(blob, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Asset proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}