// Environment variables with validation
// This ensures we're using environment variables safely throughout the app

// Log a warning in development if the environment variable is missing
const logEnvWarning = (name: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ Missing environment variable: ${name}`);
    console.warn(`Create a .env.local file with the required variables (see README)`);
  }
};

// SUPABASE_FUNCTIONS_URL is required for API calls
const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
if (!SUPABASE_FUNCTIONS_URL) {
  logEnvWarning('NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL');
}

export const env = {
  // API endpoints
  SUPABASE_FUNCTIONS_URL: SUPABASE_FUNCTIONS_URL || 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1',
};

// This ensures we're using environment variables safely
export type EnvVariables = typeof env; 