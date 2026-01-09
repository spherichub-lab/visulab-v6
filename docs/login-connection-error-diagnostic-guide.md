# Login Connection Error - Diagnostic Guide

## Problem
Error message appearing when trying to login:
> "Erro de conexão. Verifique sua internet e tente novamente."

User confirms they have internet connection.

## Most Likely Causes (Based on Analysis)

### 1. Supabase Configuration Issue (60% probability)
- Environment variables might be incorrect or expired
- ANON_KEY might be invalid or revoked
- Supabase URL might be incorrect

### 2. Network/CORS Issue (30% probability)
- CORS policy blocking requests to Supabase domain
- Network restrictions (firewall, VPN, corporate network)
- DNS resolution issues

### 3. Other Possible Causes (10% probability)
- Supabase service temporarily unavailable
- Browser security settings blocking the connection
- Ad blockers or privacy extensions interfering

## Diagnostic Logs Added

I've added comprehensive diagnostic logging to help identify the root cause:

### 1. Supabase Client Initialization (`lib/supabase.ts`)
Logs:
- Environment variable validation
- Full Supabase URL
- Key length (not the actual key for security)
- Connection test result

**Expected output:**
```
🔍 [SUPABASE DIAGNOSTIC] Environment variables loaded: {
  hasUrl: true,
  hasKey: true,
  urlPreview: "https://bcakjdsqariofrtk...",
  fullUrl: "https://bcakjdsqariofrtkncxc.supabase.co",
  fullKeyLength: 364
}
🔍 [SUPABASE DIAGNOSTIC] Supabase client created successfully...
🔍 [SUPABASE DIAGNOSTIC] Testing Supabase connection...
🔍 [SUPABASE DIAGNOSTIC] Connection test result: {
  success: true,
  hasSession: false,
  error: null
}
```

### 2. Login Attempt (`pages/Login.tsx`)
Logs:
- Login attempt start time
- Email being used
- Online/offline status
- User agent
- Complete error details if login fails

**Expected output on success:**
```
🔍 [LOGIN DIAGNOSTIC] Starting login attempt: {
  email: "user@example.com",
  timestamp: "2026-01-07T13:52:21.844Z",
  isOffline: false,
  userAgent: "Mozilla/5.0..."
}
```

**Expected output on failure:**
```
❌ [LOGIN DIAGNOSTIC] Login failed: {
  error: Error: ...,
  message: "Error message here",
  name: "Error",
  stack: "Error stack trace...",
  timestamp: "2026-01-07T13:52:21.844Z",
  isOffline: false
}
```

### 3. Authentication Service (`src/services/auth/SupabaseAuthService.ts`)
Logs:
- Sign-in call details
- Supabase response (data, error, user, session)
- Detailed error information

**Expected output on success:**
```
🔍 [AUTH DIAGNOSTIC] signIn called with: {
  email: "user@example.com",
  timestamp: "2026-01-07T13:52:21.844Z"
}
🔍 [AUTH DIAGNOSTIC] signIn response: {
  hasData: true,
  hasUser: true,
  hasSession: true,
  error: null
}
```

**Expected output on failure:**
```
🔍 [AUTH DIAGNOSTIC] signIn called with: {...}
🔍 [AUTH DIAGNOSTIC] signIn response: {
  hasData: true,
  hasUser: false,
  hasSession: false,
  error: {
    message: "Invalid login credentials",
    status: 400,
    name: "AuthApiError"
  }
}
❌ [AUTH DIAGNOSTIC] signIn failed: AuthApiError: Invalid login credentials
```

## How to Use These Logs

### Step 1: Open Browser Console
1. Open your browser (Chrome, Firefox, Edge, etc.)
2. Press `F12` or right-click and select "Inspect"
3. Go to the "Console" tab
4. Clear the console (click the 🚫 icon)

### Step 2: Reproduce the Error
1. Refresh the page to see initialization logs
2. Try to login with your credentials
3. Watch the console for diagnostic messages

### Step 3: Analyze the Logs

#### Check Supabase Initialization
Look for these logs:
```
🔍 [SUPABASE DIAGNOSTIC] Environment variables loaded
🔍 [SUPABASE DIAGNOSTIC] Supabase client created successfully
🔍 [SUPABASE DIAGNOSTIC] Testing Supabase connection...
```

**If you see errors here:**
- ❌ "Missing Supabase configuration" → Environment variables not loaded
- ❌ "Connection test failed" → Network/CORS issue or invalid credentials

#### Check Login Attempt
Look for:
```
🔍 [LOGIN DIAGNOSTIC] Starting login attempt
```

**If you see:**
- ✅ "Login realizado com sucesso!" → Login worked
- ❌ "Login failed" with error details → See error analysis below

#### Check Authentication Service
Look for:
```
🔍 [AUTH DIAGNOSTIC] signIn called with
🔍 [AUTH DIAGNOSTIC] signIn response
```

## Error Analysis Guide

### Error: "Failed to fetch" or "NetworkError"
**Cause:** CORS issue or network blocking
**Solution:**
1. Check if you're behind a corporate firewall
2. Try disabling VPN if using one
3. Check browser console for CORS errors
4. Verify Supabase project is not paused

### Error: "Invalid login credentials"
**Cause:** Wrong email/password or user doesn't exist
**Solution:**
1. Verify email and password are correct
2. Check if user exists in Supabase auth
3. Try resetting password if needed

### Error: "Invalid API key" or "JWT expired"
**Cause:** ANON_KEY is invalid or expired
**Solution:**
1. Go to Supabase dashboard → Project Settings → API
2. Copy the new ANON_KEY
3. Update `.env.local` file
4. Restart development server

### Error: "Project not found" or "Invalid project URL"
**Cause:** Supabase URL is incorrect
**Solution:**
1. Go to Supabase dashboard
2. Copy the correct project URL
3. Update `.env.local` file
4. Restart development server

### Error: "Connection timeout"
**Cause:** Network connectivity issue
**Solution:**
1. Check internet connection
2. Try accessing Supabase URL directly in browser
3. Check if Supabase service is operational (status.supabase.com)

## Next Steps

### After Collecting Logs

1. **Copy all diagnostic logs** from the console (Ctrl+A, Ctrl+C)
2. **Share the logs** so I can analyze them
3. **Look for specific error patterns** mentioned above

### Common Fixes

#### Fix 1: Regenerate ANON_KEY
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Click "Regenerate" next to anon/public key
5. Copy the new key
6. Update `.env.local`:
   ```
   VITE_SUPABASE_ANON_KEY=your-new-key-here
   ```
7. Restart dev server: `npm run dev`

#### Fix 2: Check CORS Settings
1. Go to Supabase dashboard
2. Go to Settings → API
3. Check "CORS allowed origins"
4. Add your localhost URL if not present:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Or whatever port you're using

#### Fix 3: Verify Project Status
1. Go to https://status.supabase.com/
2. Check if Supabase services are operational
3. If there's an outage, wait for it to be resolved

## Testing the Fix

After applying a fix:

1. Clear browser console
2. Refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Try to login again
4. Check console logs for success or new errors

## What to Report Back

Please provide:
1. **All console logs** starting from page refresh
2. **Specific error message** you see
3. **Browser and version** you're using
4. **Are you using VPN or corporate network?**
5. **Can you access the Supabase URL directly in browser?**
   - Try: https://bcakjdsqariofrtkncxc.supabase.co

This will help me pinpoint the exact issue and provide the correct fix.
