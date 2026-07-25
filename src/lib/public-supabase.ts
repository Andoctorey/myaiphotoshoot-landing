const DEFAULT_SUPABASE_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemdmYWp2eWpwdmJxZWR5eHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NTA5MzAsImV4cCI6MjA0OTEyNjkzMH0.39Qdq2nTCuoIpAfc7L725MZA2ls3NegFy6zCjOTzW9M';

function getSupabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
}

export function postPublicSupabaseRpc(
  functionName: string,
  body: Record<string, unknown>,
  revalidateSeconds: number,
): Promise<Response> {
  const anonKey = getSupabaseAnonKey();
  return fetch(`${getSupabaseUrl()}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: revalidateSeconds },
  });
}
