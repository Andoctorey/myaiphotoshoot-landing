import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { DEFAULT_REVALIDATE_SECONDS, withRevalidate } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = DEFAULT_REVALIDATE_SECONDS;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '24';

  try {
    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=${page}&limit=${limit}`,
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