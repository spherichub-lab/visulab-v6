# Fix: User Creation - Syncing auth.users and public.usuarios

## Problem

Users were being created only in `public.usuarios` table, but Supabase authentication requires users to exist in BOTH:
- `auth.users` - Supabase Auth table (managed by Supabase)
- `public.usuarios` - Application's user table

This caused login failures because the authentication system couldn't find the user in `auth.users`.

## Additional Issue: Auto-Login After User Creation

When creating a new user, Supabase automatically signs in the newly created user, causing the admin user to be logged out and replaced with the new user. This was fixed by immediately signing out after user creation.

## Solution

Implemented a two-step user creation process that ensures users are created in both tables with synchronized IDs, and prevents auto-login of newly created users.

## Changes Made

### 1. SupabaseAuthService - Added signUp Method

**File**: [`src/services/auth/SupabaseAuthService.ts`](src/services/auth/SupabaseAuthService.ts)

Added new method `signUp()` that creates a user in Supabase Auth:

```typescript
async signUp(email: string, password: string, metadata: { name: string; role: string }): Promise<string>
```

**Features**:
- Creates user in `auth.users` via `supabase.auth.signUp()`
- Stores user metadata (name, role) in auth user
- Returns user ID (UUID) for synchronization
- Includes debug logging for development
- Handles errors appropriately
- **IMPORTANT**: Signs out immediately after creation to prevent auto-login

### 2. usuariosService - Modified create Method

**File**: [`services/usuariosService.ts`](services/usuariosService.ts)

Updated `create()` method to accept a password parameter and implement two-step creation:

```typescript
async create(usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>, password?: string)
```

**Flow**:
1. **Step 1**: Create user in `auth.users` using `SupabaseAuthService.signUp()`
2. **Step 2**: Create user in `public.usuarios` with the same ID returned from Step 1

**Error Handling**:
- Validates that password is provided for new users
- Logs error if `public.usuarios` creation fails (auth user may need manual cleanup)
- Throws appropriate errors for UI to handle

### 3. Users Page - Updated User Creation

**File**: [`pages/Users.tsx`](pages/Users.tsx)

Modified `handleSaveUser()` to pass password when creating new users:

**Changes**:
- Added password validation (minimum 6 characters)
- Passes password to `usuariosService.create()` for new users
- Does NOT pass password for user updates (editing)
- Enhanced error handling with specific messages:
  - "Este email já está cadastrado" - User already exists
  - "A senha é obrigatória" - Password missing
  - "A senha deve ter pelo menos 6 caracteres" - Password too short
  - Generic error messages for other cases

## User Creation Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User fills form in Users.tsx                        │
│    - Name, email, password, company, role             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. usuariosService.create(usuario, password)           │
│    - Validates password is provided                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. SupabaseAuthService.signUp(email, password)      │
│    - Creates user in auth.users via Supabase Auth     │
│    - Returns user.id (UUID)                           │
│    - IMMEDIATELY SIGNS OUT to prevent auto-login       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. usuariosService.create() continues                 │
│    - Inserts in public.usuarios with same ID           │
│    - Synchronizes: name, email, empresa_id, role      │
└─────────────────────────────────────────────────────────┘
```

## Login Flow (Unchanged)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User submits credentials in Login.tsx               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. SupabaseAuthService.signIn()                       │
│    - Validates in auth.users                           │
│    - Returns session with user.id                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. AuthContext.login()                                │
│    - Queries public.usuarios for empresa_id             │
│    - Combines data from both tables                   │
└─────────────────────────────────────────────────────────┘
```

## Important Notes

### Password Requirements
- Minimum 6 characters
- Required for all new user creations
- Cannot be empty

### User Updates
- Password is NOT required when editing existing users
- Only `public.usuarios` is updated
- `auth.users` remains unchanged (password changes require separate flow)

### Auto-Login Prevention
- When creating a new user, Supabase automatically signs in the new user
- This would log out the current admin user
- **FIX**: Immediately call `signOut()` after `signUp()` to prevent this
- Admin user remains logged in and can continue managing users

### Error Scenarios

1. **User already exists in auth.users**:
   - Error message: "Este email já está cadastrado"
   - User should check if account already exists

2. **Password too short**:
   - Error message: "A senha deve ter pelo menos 6 caracteres"
   - User should provide a longer password

3. **Missing password**:
   - Error message: "A senha é obrigatória para criar um novo usuário"
   - User must provide a password

4. **public.usuarios creation fails**:
   - Error logged to console
   - Auth user may need manual cleanup in Supabase dashboard
   - User should retry creation

## Testing

### Test Case 1: Create New User
1. Navigate to Users page
2. Click "Novo Usuário"
3. Fill in all fields including password (6+ characters)
4. Click "Criar Usuário"
5. **Expected**: User created successfully, admin user remains logged in

### Test Case 2: Login with New User
1. Create a new user as above
2. Logout
3. Login with new user's email and password
4. **Expected**: Login successful, user redirected to dashboard

### Test Case 3: Duplicate Email
1. Create a user with email "test@example.com"
2. Try to create another user with same email
3. **Expected**: Error message "Este email já está cadastrado"

### Test Case 4: Short Password
1. Try to create user with password "12345"
2. **Expected**: Error message "A senha deve ter pelo menos 6 caracteres"

### Test Case 5: Edit Existing User
1. Edit an existing user
2. Change name or role
3. **Expected**: User updated successfully, password not required

### Test Case 6: Admin Remains Logged In After Creating User
1. Login as admin
2. Create a new user
3. **Expected**: Admin user remains logged in, can continue managing users

## Future Improvements

1. **Password Reset Flow**: Implement separate flow for users to change their password
2. **Email Verification**: Add email verification step for enhanced security
3. **Admin Cleanup**: Create admin function to clean up orphaned auth.users records
4. **Database Trigger**: Consider implementing Supabase trigger for automatic synchronization
5. **Rate Limiting**: Add rate limiting to prevent abuse of user creation

## Related Files

- [`src/services/auth/SupabaseAuthService.ts`](src/services/auth/SupabaseAuthService.ts) - Authentication service
- [`services/usuariosService.ts`](services/usuariosService.ts) - User management service
- [`pages/Users.tsx`](pages/Users.tsx) - User management UI
- [`pages/Login.tsx`](pages/Login.tsx) - Login page
- [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx) - Authentication context

## Deployment Checklist

- [x] Code changes implemented
- [x] Error handling added
- [x] Auto-login prevention implemented
- [ ] Test all user creation scenarios
- [ ] Test login with newly created users
- [ ] Verify admin remains logged in after creating users
- [ ] Verify error messages are user-friendly
- [ ] Update any relevant documentation
- [ ] Monitor for orphaned auth.users records
- [ ] Consider implementing cleanup script

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Supabase auth settings allow email/password signup
3. Check that RLS policies allow inserts into `public.usuarios`
4. Review Supabase logs for authentication errors
