// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers not covered by next.config.ts
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Content Security Policy - Updated for VTO feature
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.googletagmanager.com https://cdn.jsdelivr.net https://docs.opencv.org https://storage.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https: http:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https: wss: blob: data:;
    media-src 'self' blob:;
    worker-src 'self' blob:;
    frame-src 'self' https://www.google.com https://maps.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Permissions Policy - Allow camera for VTO
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
  
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
