-- RPC Function to update another user's password (admin only)
-- This function allows administrators to update any user's password
-- It includes security checks to ensure only admins can use it

-- Create the RPC function to update user password
CREATE OR REPLACE FUNCTION update_user_password(
    target_user_id UUID,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    current_user_role TEXT;
    target_user_email TEXT;
    result JSONB;
BEGIN
    -- Get the current authenticated user
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get the current user's role from public.usuarios
    SELECT role INTO current_user_role
    FROM public.usuarios
    WHERE id = current_user_id AND deleted_at IS NULL;
    
    -- Check if current user is an administrator
    IF current_user_role != 'Administrador' THEN
        RAISE EXCEPTION 'Only administrators can update other users'' passwords';
    END IF;
    
    -- Get the target user's email for logging
    SELECT email INTO target_user_email
    FROM public.usuarios
    WHERE id = target_user_id AND deleted_at IS NULL;
    
    -- Check if target user exists
    IF target_user_email IS NULL THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;
    
    -- Update the password in auth.users using Supabase's internal function
    -- This uses the built-in Supabase auth function to update the password
    PERFORM auth.update_user_password(target_user_id, new_password);
    
    -- Return success result
    result := jsonb_build_object(
        'success', true,
        'message', 'Password updated successfully',
        'user_id', target_user_id,
        'updated_by', current_user_id
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details
        result := jsonb_build_object(
            'success', false,
            'message', SQLERRM,
            'code', SQLSTATE
        );
        RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_password(UUID, TEXT) TO authenticated;

-- Create an index on the usuarios table for faster role lookups
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON public.usuarios(role) WHERE deleted_at IS NULL;

-- Add comment to document the function
COMMENT ON FUNCTION update_user_password IS 'Allows administrators to update any user''s password securely';
