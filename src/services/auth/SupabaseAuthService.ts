/**
 * Supabase Auth Service
 * Provides authentication operations using Supabase Auth
 */

import { supabase } from '../../../lib/supabase';
import { User } from '@supabase/supabase-js';

// Debug flag - set to false to disable auth debug logging in production
const DEBUG_AUTH = import.meta.env.DEV;

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'Administrador' | 'Usuário';
    avatarUrl?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthSession {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

/**
 * SupabaseAuthService
 * Service for handling authentication with Supabase
 */
export class SupabaseAuthService {
    private static readonly STORAGE_KEYS = {
        SESSION: 'visulab_session',
        USER: 'visulab_user',
    };

    /**
     * Sign in with email and password
     */
    async signIn(credentials: LoginCredentials): Promise<AuthSession> {
        console.log('🔍 [AUTH DIAGNOSTIC] signIn called with:', {
            email: credentials.email,
            timestamp: new Date().toISOString()
        });

        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        console.log('🔍 [AUTH DIAGNOSTIC] signIn response:', {
            hasData: !!data,
            hasUser: !!data?.user,
            hasSession: !!data?.session,
            error: error ? {
                message: error.message,
                status: error.status,
                name: error.name
            } : null
        });

        if (error) {
            console.error('❌ [AUTH DIAGNOSTIC] signIn failed:', error);
            throw new Error(error.message);
        }

        if (!data.user || !data.session) {
            throw new Error('Login failed: No user or session returned');
        }

        const user: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            name: (data.user.user_metadata as any)?.name || data.user.email?.split('@')[0] || 'User',
            role: (data.user.user_metadata as any)?.role || 'Usuário',
            avatarUrl: (data.user.user_metadata as any)?.avatar_url,
        };

        const session: AuthSession = {
            user,
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            // FIX: Convert expires_at from seconds to milliseconds
            expiresAt: (data.session.expires_at ?? 0) * 1000,
        };

        // Store session and user in localStorage
        SupabaseAuthService.storeSession(session);
        SupabaseAuthService.storeUser(user);

        return session;
    }

    /**
     * Sign up a new user
     * Creates user in auth.users and returns user ID
     * IMPORTANT: Does NOT automatically sign in the new user
     */
    async signUp(email: string, password: string, metadata: { name: string; role: string }): Promise<string> {
        if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] signUp called with email:', email);

        // Get current session before signup to restore if needed
        const { data: currentSession } = await supabase.auth.getSession();
        const currentUserBeforeSignup = currentSession.session?.user;
        const currentSessionData = currentSession.session;

        if (DEBUG_AUTH) {
            console.log('🔍 [AUTH DEBUG] Current user before signup:', currentUserBeforeSignup?.email || 'none');
            console.log('🔍 [AUTH DEBUG] Current session before signup:', currentSessionData ? 'exists' : 'none');
        }

        const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password,
            options: {
                data: {
                    name: metadata.name,
                    role: metadata.role,
                },
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] signUp failed:', error.message);
            throw new Error(error.message);
        }

        if (!data.user) {
            throw new Error('User creation failed: No user returned');
        }

        if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] signUp successful, user ID:', data.user.id);

        // Check if Supabase auto-signed in the new user
        const { data: sessionAfterSignup } = await supabase.auth.getSession();
        const currentUserAfterSignup = sessionAfterSignup.session?.user;

        if (DEBUG_AUTH) {
            console.log('🔍 [AUTH DEBUG] Current user after signup:', currentUserAfterSignup?.email || 'none');
            console.log('🔍 [AUTH DEBUG] User changed:',
                currentUserBeforeSignup?.id !== currentUserAfterSignup?.id);
        }

        // If user changed (Supabase auto-signed in new user), restore original session
        if (currentUserBeforeSignup && currentUserBeforeSignup.id !== currentUserAfterSignup?.id) {
            if (DEBUG_AUTH) {
                console.log('🔍 [AUTH DEBUG] Auto-login detected, restoring original user:', currentUserBeforeSignup.email);
                console.log('🔍 [AUTH DEBUG] Original session data:', currentSessionData ? {
                    userId: currentSessionData.user.id,
                    email: currentSessionData.user.email,
                    hasAccessToken: !!currentSessionData.access_token,
                    hasRefreshToken: !!currentSessionData.refresh_token
                } : 'none');
            }

            // Restore original session using setSession
            if (currentSessionData) {
                const { error: setSessionError } = await supabase.auth.setSession({
                    access_token: currentSessionData.access_token,
                    refresh_token: currentSessionData.refresh_token,
                });

                if (setSessionError) {
                    if (DEBUG_AUTH) console.error('❌ [AUTH DEBUG] Failed to restore original session:', setSessionError);
                    // If we can't restore the session, we'll be logged out
                    // This is a fallback - the user will need to log in again
                } else {
                    if (DEBUG_AUTH) console.log('✅ [AUTH DEBUG] Original session restored successfully');
                }
            }
        }

        return data.user.id;
    }

    /**
     * Sign out current user
     */
    async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Sign out error:', error);
        }

        // Clear session and user from localStorage
        SupabaseAuthService.clearSession();
        SupabaseAuthService.clearUser();
    }

    /**
     * Get current user from Supabase
     */
    async getCurrentUser(): Promise<AuthUser | null> {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Get current user error:', error);
            return null;
        }

        if (!data.user) {
            return null;
        }

        return {
            id: data.user.id,
            email: data.user.email || '',
            name: (data.user.user_metadata as any)?.name || data.user.email?.split('@')[0] || 'User',
            role: (data.user.user_metadata as any)?.role || 'Usuário',
            avatarUrl: (data.user.user_metadata as any)?.avatar_url,
        };
    }

    /**
     * Get current session from Supabase
     */
    async getCurrentSession(): Promise<AuthSession | null> {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Get current session error:', error);
            return null;
        }

        if (!data.session) {
            return null;
        }

        const user: AuthUser = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: (data.session.user.user_metadata as any)?.name || data.session.user.email?.split('@')[0] || 'User',
            role: (data.session.user.user_metadata as any)?.role || 'Usuário',
            avatarUrl: (data.session.user.user_metadata as any)?.avatar_url,
        };

        const session: AuthSession = {
            user,
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            // FIX: Convert expires_at from seconds to milliseconds
            expiresAt: (data.session.expires_at ?? 0) * 1000,
        };

        return session;
    }

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
        if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Setting up onAuthStateChange listener');

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (DEBUG_AUTH) {
                console.log('🔍 [AUTH DEBUG] Supabase auth event received:', event);
                console.log('🔍 [AUTH DEBUG] Session data:', session ? {
                    userId: session.user.id,
                    email: session.user.email,
                    hasAccessToken: !!session.access_token,
                    expiresAt: session.expires_at ? new Date(session.expires_at).toISOString() : null
                } : null);
            }

            if (event === 'SIGNED_IN' && session) {
                const user: AuthUser = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: (session.user.user_metadata as any)?.name || session.user.email?.split('@')[0] || 'User',
                    role: (session.user.user_metadata as any)?.role || 'Usuário',
                    avatarUrl: (session.user.user_metadata as any)?.avatar_url,
                };

                const authSession: AuthSession = {
                    user,
                    accessToken: session.access_token,
                    refreshToken: session.refresh_token,
                    // FIX: Convert expires_at from seconds to milliseconds
                    expiresAt: (session.expires_at ?? 0) * 1000,
                };

                SupabaseAuthService.storeSession(authSession);
                SupabaseAuthService.storeUser(user);
                if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Calling callback with SIGNED_IN session');
                callback(authSession);
            } else if (event === 'SIGNED_OUT') {
                if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] SIGNED_OUT event received, clearing storage and calling callback');
                SupabaseAuthService.clearSession();
                SupabaseAuthService.clearUser();
                callback(null);
            } else {
                if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Unhandled auth event:', event);
            }
        });

        return () => {
            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Unsubscribing from auth state changes');
            data.subscription.unsubscribe();
        };
    }

    /**
     * Refresh session token
     * FIX: Don't clear storage on refresh failure - let Supabase handle it
     */
    async refreshSession(): Promise<AuthSession | null> {
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
            console.error('Refresh session error:', error);
            return null;
        }

        if (!data.session || !data.user) {
            // FIX: Don't clear storage - let Supabase handle session state
            return null;
        }

        const user: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            name: (data.user.user_metadata as any)?.name || data.user.email?.split('@')[0] || 'User',
            role: (data.user.user_metadata as any)?.role || 'Usuário',
            avatarUrl: (data.user.user_metadata as any)?.avatar_url,
        };

        const session: AuthSession = {
            user,
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            // FIX: Convert expires_at from seconds to milliseconds
            expiresAt: (data.session.expires_at ?? 0) * 1000,
        };

        SupabaseAuthService.storeSession(session);
        SupabaseAuthService.storeUser(user);

        return session;
    }

    /**
     * Update user password
     */
    async updatePassword(password: string): Promise<void> {
        if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] updatePassword called');

        const { error } = await supabase.auth.updateUser({
            password
        });

        if (error) {
            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] updatePassword failed:', error.message);
            throw new Error(error.message);
        }

        if (DEBUG_AUTH) console.log('✅ [AUTH DEBUG] Password updated successfully');
    }

    /**
     * Store session in localStorage
     */
    static storeSession(session: AuthSession): void {
        localStorage.setItem(SupabaseAuthService.STORAGE_KEYS.SESSION, JSON.stringify(session));
    }

    /**
     * Get session from localStorage
     */
    static getStoredSession(): AuthSession | null {
        const stored = localStorage.getItem(SupabaseAuthService.STORAGE_KEYS.SESSION);
        if (!stored) {
            return null;
        }
        try {
            return JSON.parse(stored) as AuthSession;
        } catch {
            return null;
        }
    }

    /**
     * Clear session from localStorage
     */
    static clearSession(): void {
        localStorage.removeItem(SupabaseAuthService.STORAGE_KEYS.SESSION);
    }

    /**
     * Store user in localStorage
     */
    static storeUser(user: AuthUser): void {
        localStorage.setItem(SupabaseAuthService.STORAGE_KEYS.USER, JSON.stringify(user));
    }

    /**
     * Get user from localStorage
     */
    static getStoredUser(): AuthUser | null {
        const stored = localStorage.getItem(SupabaseAuthService.STORAGE_KEYS.USER);
        if (!stored) {
            return null;
        }
        try {
            return JSON.parse(stored) as AuthUser;
        } catch {
            return null;
        }
    }

    /**
     * Clear user from localStorage
     */
    static clearUser(): void {
        localStorage.removeItem(SupabaseAuthService.STORAGE_KEYS.USER);
    }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService();
