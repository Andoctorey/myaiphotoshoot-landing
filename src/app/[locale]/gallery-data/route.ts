import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { withRevalidate } from '@/lib/cache';

/**
 * Gallery data API route
 * 
 * STATIC EXPORT NOTE:
 * This route is configured for static generation to work with Cloudflare Pages.
 * It returns a fixed dataset generated at build time and cannot process dynamic query parameters.
 * Client-side pagination is handled directly via the Supabase API in the Gallery component.
 */

export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour revalidation

// Required for static export with dynamic route parameters
export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'ru' }
  ];
}

// Simplified static version - always returns first page of results
export async function GET() {
  try {
    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=1&limit=24`,
      withRevalidate()
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch gallery data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching gallery data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery data' },
      { status: 500 }
    );
  }
} 