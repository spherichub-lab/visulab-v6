import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verify the request is authenticated
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Get request body
        const { target_user_id, new_password } = await req.json()

        // Validate required fields
        if (!target_user_id || !new_password) {
            throw new Error('Missing required fields: target_user_id and new_password')
        }

        // Validate password length
        if (new_password.length < 6) {
            throw new Error('Password must be at least 6 characters long')
        }

        // Initialize Supabase client with service role key
        // This allows us to update other users' passwords
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Verify the current user is authenticated and is an admin
        const { data: { user }, error: userError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (userError || !user) {
            throw new Error('Invalid authentication')
        }

        // Check if the user is an administrator in the public.usuarios table
        const { data: userData, error: userDataError } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', user.id)
            .eq('deleted_at', null)
            .single()

        if (userDataError || !userData) {
            throw new Error('User not found in usuarios table')
        }

        if (userData.role !== 'Administrador') {
            throw new Error('Only administrators can update other users\' passwords')
        }

        // Verify the target user exists
        const { data: targetUser, error: targetUserError } = await supabase
            .from('usuarios')
            .select('id, email')
            .eq('id', target_user_id)
            .eq('deleted_at', null)
            .single()

        if (targetUserError || !targetUser) {
            throw new Error('Target user not found')
        }

        // Update the user's password using the admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            target_user_id,
            { password: new_password }
        )

        if (updateError) {
            throw new Error(`Failed to update password: ${updateError.message}`)
        }

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Password updated successfully',
                user_id: target_user_id,
                updated_by: user.id
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Error in update-user-password function:', error)

        return new Response(
            JSON.stringify({
                success: false,
                message: error.message || 'An error occurred',
                code: error.code || 'UNKNOWN_ERROR'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
