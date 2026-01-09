# Password Update Fix - Deployment Guide

## Overview
This fix resolves the issue where administrators could edit user information but password changes were not being saved to Supabase Auth.

## Problem
When an admin edited another user's password, the password field was ignored and never sent to Supabase Auth, so the new password didn't work.

## Solution
Implemented a secure Supabase Edge Function that allows administrators to update other users' passwords.

## Files Modified
1. **supabase/functions/update-user-password/index.ts** - New Supabase Edge Function
2. **services/usuariosService.ts** - Added `updatePassword()` method
3. **pages/Users.tsx** - Updated to call `updatePassword()` when password is provided

## Deployment Steps

### Step 1: Deploy the Edge Function to Supabase

You need to deploy the Edge Function to your Supabase project. Choose one of the following methods:

#### Option A: Using Supabase CLI (Recommended)
If you have the Supabase CLI installed:

```bash
# From your project root directory
supabase functions deploy update-user-password
```

This will automatically deploy the Edge Function from the `supabase/functions/update-user-password/` directory.

#### Option B: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** (in the left sidebar)
3. Click **New Function**
4. Name it `update-user-password`
5. Copy the contents of `supabase/functions/update-user-password/index.ts`
6. Paste it into the editor
7. Click **Deploy**

### Step 2: Set Environment Variables (Required)

The Edge Function requires the `SUPABASE_SERVICE_ROLE_KEY` environment variable to be set. This allows the function to update other users' passwords.

**Using Supabase CLI:**
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Using Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Find the `SUPABASE_SERVICE_ROLE_KEY` environment variable
4. Set it to your service role key (available in Project Settings → API)

**Note:** The service role key is different from the anon key and should never be exposed in client-side code. It's safe to use in Edge Functions because they run server-side.

### Step 3: Verify the Function is Deployed

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. You should see `update-user-password` in the list
4. Click on it to view logs and details

### Step 3: Test the Implementation

1. Start your development server (if not already running):
   ```bash
   npm run dev
   ```

2. Log in as an administrator

3. Go to the Users page

4. Edit an existing user

5. Enter a new password in the password field

6. Save the changes

7. Log out and try to log in as that user with the new password

## How It Works

### The Edge Function (`update-user-password`)
- Accepts HTTP POST requests with JSON body containing `target_user_id` and `new_password`
- Validates the JWT token from the Authorization header
- Checks that the current user has the "Administrador" role in the `usuarios` table
- Uses the Supabase Admin API (`supabase.auth.admin.updateUserById()`) to update the password
- Returns a JSON response with success/error information

### Security Features
- **Authentication Required**: Verifies the JWT token from the Authorization header
- **Role Check**: Only users with "Administrador" role can use this function
- **Service Role Key**: Uses the service role key (server-side only) to update passwords
- **Input Validation**: Validates password length and required fields
- **CORS Enabled**: Allows browser requests from any origin
- **Error Handling**: Returns detailed error messages without exposing sensitive information

### The Service Layer
The `usuariosService.updatePassword()` method:
- Calls the Edge Function via `supabase.functions.invoke()`
- Passes the current session's access token for authentication
- Handles errors and throws appropriate exceptions
- Includes debug logging for troubleshooting

### The UI Layer
The `Users.tsx` component:
- Checks if a password was provided when editing
- Only calls `updatePassword()` if the password field is not empty
- Maintains backward compatibility (empty password = no change)

## Troubleshooting

### Error: "Function not found" or "404 Not Found"
**Cause**: The Edge Function hasn't been deployed to Supabase.

**Solution**: Deploy the Edge Function using `supabase functions deploy update-user-password` or via the dashboard.

### Error: "SUPABASE_SERVICE_ROLE_KEY not set"
**Cause**: The required environment variable is not configured for the Edge Function.

**Solution**: Set the service role key using `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key` or via the dashboard.

### Error: "Invalid authentication"
**Cause**: The user is not logged in or the session token is invalid.

**Solution**: Ensure you're logged in and the session is valid. Try logging out and logging back in.

### Error: "Only administrators can update other users' passwords"
**Cause**: The current user doesn't have the "Administrador" role.

**Solution**: Ensure you're logged in as an administrator. Check the user's role in the `public.usuarios` table.

### Error: "User not authenticated"
**Cause**: No user is currently logged in.

**Solution**: Log in before attempting to update another user's password.

### Error: "Target user not found"
**Cause**: The user ID doesn't exist or the user has been deleted.

**Solution**: Verify the user exists and is not soft-deleted (deleted_at is null).

## Rollback Procedure

If you need to remove this functionality:

1. Delete the Edge Function:
```bash
supabase functions delete update-user-password
```

Or remove it via the Supabase Dashboard.

2. Revert the changes in:
- `services/usuariosService.ts` (remove the `updatePassword` method)
- `pages/Users.tsx` (remove the password update logic)

## Additional Notes

- The password field in the edit modal has a placeholder: "Deixe em branco para manter" (Leave blank to keep)
- This maintains the existing behavior where empty password = no change
- Passwords are only updated when a non-empty value is provided
- All password updates are logged to the console for debugging (in development mode)

## Security Considerations

- The Edge Function uses the service role key (server-side only) to update passwords
- It explicitly checks the user's role before allowing password updates
- Only administrators can update other users' passwords
- The service role key is never exposed to client-side code
- All requests require valid JWT authentication
- Consider adding audit logging in production to track password changes
- Monitor Edge Function logs for suspicious activity
