# Deploy Password Fix via Supabase Dashboard

Since the Supabase CLI is not installed, you can deploy the Edge Function using the Supabase Dashboard instead.

## Step 1: Go to Supabase Dashboard

1. Open your browser and go to: `https://supabase.com/dashboard`
2. Select your project

## Step 2: Create the Edge Function

1. In the left sidebar, click on **Edge Functions**
2. Click the **New Function** button
3. Enter the function name: `update-user-password`
4. Click **Create**

## Step 3: Copy the Edge Function Code

1. Open the file: `supabase/functions/update-user-password/index.ts` in your project
2. Copy all the code from that file

## Step 4: Paste the Code

1. In the Supabase Dashboard Edge Function editor
2. Delete any existing code
3. Paste the code you copied
4. Click **Save**

## Step 5: Deploy the Function

1. Click the **Deploy** button
2. Wait for the deployment to complete (usually takes 10-30 seconds)
3. You should see a green checkmark when it's done

## Step 6: Set the Service Role Key

1. Click on the **Settings** tab in the Edge Function page
2. Find the **Environment Variables** section
3. Click **Add Variable**
4. Name: `SUPABASE_SERVICE_ROLE_KEY`
5. Value: Your service role key (get it from Step 7)
6. Click **Save**

## Step 7: Get Your Service Role Key

1. In the Supabase Dashboard, go to **Settings** (left sidebar)
2. Click on **API**
3. Scroll down to **Project API keys**
4. Find the **service_role** key
5. Click the **Copy** button next to it
6. Paste this value in Step 6

## Step 8: Test the Fix

1. Refresh your application
2. Log in as an administrator
3. Go to the Users page
4. Edit an existing user
5. Enter a new password in the password field
6. Click **Salvar Alterações**
7. Log out
8. Try to log in as that user with the new password

## Verification

If everything is working:
- You should see "Usuário atualizado." (User updated) message
- The user should be able to log in with the new password
- No error messages should appear

## Troubleshooting

### Error: "Edge Function not deployed"
**Solution**: Make sure you completed Step 5 (Deploy the Function)

### Error: "SUPABASE_SERVICE_ROLE_KEY not set"
**Solution**: Make sure you completed Step 6 (Set the Service Role Key)

### Error: "Only administrators can update other users' passwords"
**Solution**: Make sure you're logged in as an administrator user

## Summary

✅ Created Edge Function code in `supabase/functions/update-user-password/index.ts`
✅ Updated `services/usuariosService.ts` to call the Edge Function
✅ Updated `pages/Users.tsx` to pass password when editing
⏳ **You need to deploy the Edge Function via Dashboard (Steps 1-7 above)**

After completing these steps, the password update feature will work!
