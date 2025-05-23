import { NextResponse } from 'next/server';
import type { Viewport } from 'next';

/**
 * .well-known/appspecific API route
 * 
 * STATIC EXPORT NOTE:
 * This route is configured for static generation to work with Cloudflare Pages.
 * It provides fixed metadata for client applications.
 */

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

// Static export configuration
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour revalidation

// Required for static export with dynamic route parameters
export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'zh' },
    { locale: 'hi' },
    { locale: 'es' },
    { locale: 'de' },
    { locale: 'ja' },
    { locale: 'ru' },
    { locale: 'fr' },
    { locale: 'ar' }
  ];
}

export async function GET() {
  return NextResponse.json({
    viewport: {
      colorScheme: 'light dark'
    }
  });
} 