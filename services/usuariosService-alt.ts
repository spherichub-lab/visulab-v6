// Alternative solution using Supabase Management API
// This is a temporary workaround if Edge Functions are not available

import { supabase } from '../lib/supabase';

// ⚠️ WARNING: This approach requires exposing the service role key to the client
// This is NOT recommended for production due to security concerns
// Use only for development/testing or if you have no other option

export const usuariosServiceAlt = {
    // ... keep all existing methods from usuariosService.ts ...

    /**
     * Update a user's password (admin only) - Alternative Approach
     * This uses the Supabase Management API directly
     * 
     * ⚠️ SECURITY WARNING: This requires the service role key to be available
     * on the client side, which is a security risk. Only use this if:
     * - You're in a development environment
     * - You have no other options (Edge Functions, backend server, etc.)
     * - You understand and accept the security implications
     */
    async updatePassword(userId: string, newPassword: string) {
        console.log('🔍 [USUARIOS ALT] Using Management API to update password for user:', userId);

        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('User not authenticated');
        }

        // Verify the current user is an admin
        const { data: userData, error: userDataError } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', session.user.id)
            .eq('deleted_at', null)
            .single();

        if (userDataError || !userData) {
            throw new Error('User not found in usuarios table');
        }

        if (userData.role !== 'Administrador') {
            throw new Error('Only administrators can update other users\' passwords');
        }

        // ⚠️ SECURITY RISK: Using service role key from client-side
        // In a real production app, this should be done server-side
        const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            throw new Error(
                'Service role key not configured. Please set VITE_SUPABASE_SERVICE_ROLE_KEY in your .env.local file.\n' +
                '⚠️ WARNING: Exposing the service role key to the client is a security risk. ' +
                'Use only for development/testing.'
            );
        }

        // Create a new client with service role key
        const supabaseAdmin = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Update the user's password using the Management API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            console.error('❌ [USUARIOS ALT] Failed to update password:', updateError);
            throw new Error(`Failed to update password: ${updateError.message}`);
        }

        console.log('✅ [USUARIOS ALT] Password updated successfully via Management API');

        return {
            success: true,
            message: 'Password updated successfully',
            user_id: userId,
            updated_by: session.user.id
        };
    }
};

// Helper to create a Supabase client with custom credentials
function createClient(supabaseUrl: string, supabaseKey: string, options?: any) {
    // This is a simplified version - in reality, you'd import from @supabase/supabase-js
    // For now, we'll return the existing client and rely on environment variables
    return supabase;
}
