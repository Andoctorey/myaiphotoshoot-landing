import { NextResponse } from 'next/server';
import type { Viewport } from 'next';

/**
 * .well-known/appspecific API route
 * 
 * CLOUDFLARE PAGES NOTE:
 * This route provides metadata for client applications on Cloudflare Pages.
 */

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export const revalidate = 3600; // 1 hour revalidation

export async function GET() {
  return NextResponse.json({
    viewport: {
      colorScheme: 'light dark'
    }
  });
} 