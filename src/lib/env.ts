// src/lib/env.ts
// Environment variable validation for runtime safety

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
} as const;

const optionalEnvVars = {
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  NEXT_PUBLIC_DIRECTUS_URL: process.env.NEXT_PUBLIC_DIRECTUS_URL,
  IG_USER_ID: process.env.IG_USER_ID,
  IG_ACCESS_TOKEN: process.env.IG_ACCESS_TOKEN,
} as const;

// Validate required environment variables at startup
export function validateEnv() {
  const missingVars: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }

  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    // Don't throw in production to allow graceful degradation
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

// Type-safe environment access
export const env = {
  // Required
  DATABASE_URL: requiredEnvVars.DATABASE_URL || '',
  
  // Optional with defaults
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: optionalEnvVars.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  GOOGLE_PLACES_API_KEY: optionalEnvVars.GOOGLE_PLACES_API_KEY || optionalEnvVars.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  NEXT_PUBLIC_DIRECTUS_URL: optionalEnvVars.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055',
  
  // Helpers
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

export default env;
