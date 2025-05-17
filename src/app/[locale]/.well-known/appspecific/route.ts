import { NextResponse } from 'next/server';
import type { Viewport } from 'next';

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export async function GET() {
  return NextResponse.json({
    viewport: {
      colorScheme: 'light dark'
    }
  });
} 