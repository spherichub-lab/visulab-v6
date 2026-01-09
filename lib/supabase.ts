
import { createClient } from '@supabase/supabase-js';

// Support both VITE_ prefixed and non-prefixed environment variables
// Vite defines these as process.env.VITE_* variables
// Node.js scripts may use non-prefixed versions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// TEMPORARY: Environment validation logs
console.log('🔍 [SUPABASE DIAGNOSTIC] Environment variables loaded:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'none',
    keyPreview: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'none',
    fullUrl: supabaseUrl,
    fullKeyLength: supabaseKey?.length
});

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ [SUPABASE DIAGNOSTIC] Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
    });
    throw new Error(
        'Missing Supabase configuration. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
    );
}

// Create Supabase client with explicit auth configuration
// FIX: Explicitly configure auth options to prevent transient null-session states
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage
    }
});

console.log('🔍 [SUPABASE DIAGNOSTIC] Supabase client created successfully with auth config:', {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: 'localStorage',
    clientUrl: supabaseUrl
});

// Test connection immediately
console.log('🔍 [SUPABASE DIAGNOSTIC] Testing Supabase connection...');
supabase.auth.getSession().then(({ data, error }) => {
    console.log('🔍 [SUPABASE DIAGNOSTIC] Connection test result:', {
        success: !error,
        hasSession: !!data.session,
        error: error ? {
            message: error.message,
            status: error.status,
            name: error.name
        } : null
    });
}).catch((err) => {
    console.error('❌ [SUPABASE DIAGNOSTIC] Connection test failed:', err);
});
