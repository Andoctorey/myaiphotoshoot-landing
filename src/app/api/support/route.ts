import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { email, message } = body;
    
    // Validate inputs
    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      );
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if Supabase Functions URL is configured
    if (!env.SUPABASE_FUNCTIONS_URL) {
      console.error('Supabase Functions URL is not configured');
      return NextResponse.json(
        { error: 'Support service not configured' },
        { status: 500 }
      );
    }

    // Send support request to Supabase function
    const response = await fetch(`${env.SUPABASE_FUNCTIONS_URL}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Supabase function responded with status: ${response.status}`);
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending support request:', error);
    
    return NextResponse.json(
      { error: 'Failed to send support request' },
      { status: 500 }
    );
  }
} 