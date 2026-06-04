import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration check.
 * Ensures the app doesn't crash if Supabase credentials are not configured yet,
 * providing a graceful developer environment fallback.
 */
const rawSupabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Clean up URL to prevent trailing slashes or accidental /rest/v1, /auth/v1 pathways
function sanitizeSupabaseUrl(url: any): string {
  if (typeof url !== 'string') return '';
  let trimmed = url.trim();
  
  // Strip trailing slashes
  while (trimmed.endsWith('/')) {
    trimmed = trimmed.slice(0, -1);
  }
  
  // Remove common accidental suffixes
  const suffixes = ['/rest/v1', '/auth/v1', '/v1'];
  for (const suffix of suffixes) {
    if (trimmed.endsWith(suffix)) {
      trimmed = trimmed.slice(0, -suffix.length);
    }
  }
  return trimmed;
}

const cleanedUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
const isUrlConfigured = !!(cleanedUrl && cleanedUrl.startsWith('https://') && !cleanedUrl.includes('your-project-id'));
const isKeyConfigured = !!(supabaseAnonKey && supabaseAnonKey !== 'your-anon-key' && supabaseAnonKey.length > 20);

export const isSupabaseConfigured = isUrlConfigured && isKeyConfigured;

// Standard dummy credentials used to safely instantiate the client in preview mode
const safeUrl = isUrlConfigured ? cleanedUrl : 'https://placeholder-vuu-transport.supabase.co';
const safeKey = isKeyConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Set to false to avoid unwanted redirects in preview frames
  },
});

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ VUU Transport: Supabase is in Demo Mode. ' +
    'Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your secrets to connect to your real Supabase instance.'
  );
}
