// src/lib/rate-limit.ts
// Simple in-memory rate limiter for API routes

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
}

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
};

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { success: boolean; remaining: number; resetTime: number } {
  const { windowMs, maxRequests } = { ...defaultOptions, ...options };
  const now = Date.now();
  
  let entry = rateLimitStore.get(identifier);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }
  
  if (entry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  entry.count++;
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

// Middleware helper for API routes
export function checkRateLimit(
  request: Request,
  options?: RateLimitOptions
): { allowed: boolean; headers: Record<string, string> } {
  const ip = getClientIp(request);
  const result = rateLimit(ip, options);
  
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
  
  if (!result.success) {
    headers['Retry-After'] = Math.ceil((result.resetTime - Date.now()) / 1000).toString();
  }
  
  return {
    allowed: result.success,
    headers,
  };
}
