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

// MailerSend configuration
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
if (!MAILERSEND_API_KEY) {
  logEnvWarning('MAILERSEND_API_KEY');
}

const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL;
if (!MAILERSEND_FROM_EMAIL) {
  logEnvWarning('MAILERSEND_FROM_EMAIL');
}

const MAILERSEND_TO_EMAIL = process.env.MAILERSEND_TO_EMAIL;
if (!MAILERSEND_TO_EMAIL) {
  logEnvWarning('MAILERSEND_TO_EMAIL');
}

export const env = {
  // API endpoints
  SUPABASE_FUNCTIONS_URL: SUPABASE_FUNCTIONS_URL || 'https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1',
  
  // MailerSend configuration
  MAILERSEND_API_KEY: MAILERSEND_API_KEY || '',
  MAILERSEND_FROM_EMAIL: MAILERSEND_FROM_EMAIL || 'support@myaiphotoshoot.com',
  MAILERSEND_TO_EMAIL: MAILERSEND_TO_EMAIL || 'support@myaiphotoshoot.com',
};

// This ensures we're using environment variables safely
export type EnvVariables = typeof env; 