# Quick Deployment Guide - Password Update Fix

## ⚠️ IMPORTANT: You MUST deploy the Edge Function before the fix will work!

The error "Failed to send a request to the Edge Function" means the Edge Function hasn't been deployed yet.

## Step-by-Step Deployment

### 1. Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link your project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in the Supabase Dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### 4. Deploy the Edge Function
```bash
supabase functions deploy update-user-password
```

### 5. Set the Service Role Key
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get your service role key from:
- Go to Supabase Dashboard
- Navigate to: Project Settings → API
- Copy the "service_role" key

### 6. Verify Deployment
```bash
supabase functions list
```

You should see `update-user-password` in the list.

### 7. Test the Fix
1. Refresh your application
2. Log in as an administrator
3. Go to the Users page
4. Edit an existing user
5. Enter a new password
6. Save the changes
7. Log out and try to log in as that user with the new password

## Troubleshooting

### Error: "Failed to send a request to the Edge Function"
**Solution**: The Edge Function is not deployed. Run step 4 above.

### Error: "SUPABASE_SERVICE_ROLE_KEY not set"
**Solution**: Run step 5 above to set the service role key.

### Error: "supabase: command not found"
**Solution**: Install the Supabase CLI using step 1 above.

### Error: "Not linked to a project"
**Solution**: Run step 3 above to link your project.

## Alternative: Deploy via Dashboard

If you prefer using the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Click **New Function**
4. Name it `update-user-password`
5. Copy the contents of `supabase/functions/update-user-password/index.ts`
6. Paste it into the editor
7. Click **Deploy**
8. Go to **Settings** → **Edge Functions**
9. Add environment variable: `SUPABASE_SERVICE_ROLE_KEY` = your-service-role-key

## Files Modified
- ✅ `supabase/functions/update-user-password/index.ts` - Edge Function (needs deployment)
- ✅ `services/usuariosService.ts` - Updated to call Edge Function
- ✅ `pages/Users.tsx` - Updated to pass password when editing

## What This Fix Does
When an admin edits a user and enters a new password:
1. The password is sent to the Edge Function
2. The Edge Function validates the admin's role
3. The Edge Function uses the Admin API to update the password
4. The user can now log in with the new password

## Backward Compatibility
- Empty password field = no change (existing behavior maintained)
- Only updates password when a non-empty value is provided
