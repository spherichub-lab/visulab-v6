/**
 * AuthContext - Authentication state management
 * Provides user authentication state and session management using Supabase Auth
 * 
 * SECURITY IMPROVEMENTS:
 * - Server-side session validation on app load
 * - Automatic token refresh before expiry (5 minutes before)
 * - Session activity tracking for timeout management
 * - Multi-tab session synchronization using storage events and BroadcastChannel
 * - Graceful token refresh with retry logic
 * - Session timeout with user warning
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, ReactNode } from 'react';
import { LoginCredentials, AuthTokens, AuthUser } from '../types/api/api.types';
import { showSuccess, showWarning } from '../utils/errorHandler';
import { supabaseAuthService, SupabaseAuthService, type AuthSession } from '../services/auth/SupabaseAuthService';
import { usuariosService } from '../../services/usuariosService';

// Debug flag - set to false to disable auth debug logging in production
const DEBUG_AUTH = import.meta.env.DEV;

// ============================================================================
// CONSTANTS
// ============================================================================

// Token refresh threshold - refresh tokens 5 minutes before expiry
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

// Session timeout settings
const SESSION_TIMEOUT_DURATION = 240 * 60 * 1000; // 4 hours of inactivity
const SESSION_WARNING_DURATION = 5 * 60 * 1000; // Show warning 5 minutes before timeout

// Token refresh retry settings
const MAX_REFRESH_RETRIES = 3;
const REFRESH_RETRY_DELAY = 2000; // 2 seconds between retries

// Broadcast channel name for multi-tab sync
const AUTH_BROADCAST_CHANNEL = 'visulab_auth_sync';

// ============================================================================
// TYPES
// ============================================================================

// Auth state interface
export interface AuthState {
    user: AuthUser | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    lastActivity: number | null;
    sessionWarningShown: boolean;
}

// Auth action types
export type AuthAction =
    | { type: 'AUTH_START_LOADING' }
    | { type: 'AUTH_STOP_LOADING' }
    | { type: 'AUTH_SET_INITIALIZED' }
    | { type: 'AUTH_LOGIN_SUCCESS'; payload: { user: AuthUser; tokens: AuthTokens } }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_UPDATE_USER'; payload: Partial<AuthUser> }
    | { type: 'AUTH_REFRESH_TOKENS'; payload: AuthTokens }
    | { type: 'AUTH_UPDATE_ACTIVITY'; payload: number }
    | { type: 'AUTH_SHOW_SESSION_WARNING' }
    | { type: 'AUTH_HIDE_SESSION_WARNING' };

// Broadcast message types for multi-tab sync
type AuthBroadcastMessage =
    | { type: 'LOGIN'; timestamp: number }
    | { type: 'LOGOUT'; timestamp: number }
    | { type: 'REFRESH'; timestamp: number }
    | { type: 'ACTIVITY'; timestamp: number };

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    lastActivity: null,
    sessionWarningShown: false,
};

// ============================================================================
// REDUCER
// ============================================================================

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'AUTH_START_LOADING':
            return {
                ...state,
                isLoading: true,
            };

        case 'AUTH_STOP_LOADING':
            return {
                ...state,
                isLoading: false,
            };

        case 'AUTH_SET_INITIALIZED':
            return {
                ...state,
                isInitialized: true,
                isLoading: false,
            };

        case 'AUTH_LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                tokens: action.payload.tokens,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                lastActivity: Date.now(),
                sessionWarningShown: false,
            };

        case 'AUTH_LOGOUT':
            return {
                ...state,
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                lastActivity: null,
                sessionWarningShown: false,
            };

        case 'AUTH_UPDATE_USER':
            return {
                ...state,
                user: state.user ? { ...state.user, ...action.payload } : null,
            };

        case 'AUTH_REFRESH_TOKENS':
            return {
                ...state,
                tokens: action.payload,
            };

        case 'AUTH_UPDATE_ACTIVITY':
            return {
                ...state,
                lastActivity: action.payload,
                sessionWarningShown: false,
            };

        case 'AUTH_SHOW_SESSION_WARNING':
            return {
                ...state,
                sessionWarningShown: true,
            };

        case 'AUTH_HIDE_SESSION_WARNING':
            return {
                ...state,
                sessionWarningShown: false,
            };

        default:
            return state;
    }
};

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

export interface AuthContextType {
    // State
    user: AuthUser | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    lastActivity: number | null;
    sessionWarningShown: boolean;

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<AuthUser>) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    refreshToken: () => Promise<void>;
    extendSession: () => void;

    // Utilities
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    validateSession: () => Promise<boolean>;
}

// ============================================================================
// AUTH CONTEXT
// ============================================================================

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// AUTH PROVIDER
// ============================================================================

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Refs for managing timers and intervals
    const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionTimeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
    const activityCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
    const isRefreshingRef = useRef(false);
    const refreshRetryCountRef = useRef(0);
    const isLoggingInRef = useRef(false);

    // Refs to avoid circular dependencies
    const dispatchRef = useRef(dispatch);
    const broadcastChannelRefForMessage = useRef<BroadcastChannel | null>(null);

    // Keep dispatch ref updated
    useEffect(() => {
        dispatchRef.current = dispatch;
    }, [dispatch]);

    // ============================================================================
    // TOKEN REFRESH MECHANISM WITH RETRY LOGIC
    // ============================================================================

    /**
     * Schedule token refresh based on expiry time
     * SECURITY: Automatically refresh tokens before they expire to prevent
     * authentication failures during user activity
     */
    const scheduleTokenRefresh = useCallback(() => {
        // Clear any existing timer
        if (tokenRefreshTimerRef.current) {
            clearTimeout(tokenRefreshTimerRef.current);
        }

        const tokens = state.tokens;
        if (!tokens?.expiresAt) {
            return;
        }

        const timeUntilExpiry = tokens.expiresAt - Date.now();

        // If token is already expired, refresh immediately
        if (timeUntilExpiry <= 0) {
            refreshToken();
            return;
        }

        // If token is close to expiry (within threshold), refresh soon
        if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
            tokenRefreshTimerRef.current = setTimeout(() => {
                refreshToken();
            }, timeUntilExpiry);
        } else {
            // Otherwise, schedule refresh for threshold before expiry
            const refreshDelay = timeUntilExpiry - TOKEN_REFRESH_THRESHOLD;
            tokenRefreshTimerRef.current = setTimeout(() => {
                refreshToken();
            }, refreshDelay);
        }
    }, [state.tokens]);

    /**
     * Refresh tokens with retry logic
     * SECURITY: Implements exponential backoff and graceful failure handling
     */
    const refreshToken = useCallback(async (): Promise<void> => {
        // Prevent concurrent refresh attempts
        if (isRefreshingRef.current) {
            console.log('Token refresh already in progress, skipping...');
            return;
        }

        isRefreshingRef.current = true;

        try {
            const session = await supabaseAuthService.refreshSession();

            if (session) {
                dispatchRef.current({
                    type: 'AUTH_REFRESH_TOKENS',
                    payload: session,
                });

                // Reset retry count on success
                refreshRetryCountRef.current = 0;

                // Broadcast refresh to other tabs
                if (broadcastChannelRefForMessage.current) {
                    try {
                        broadcastChannelRefForMessage.current.postMessage({ type: 'REFRESH', timestamp: Date.now() });
                    } catch (error) {
                        console.warn('Failed to broadcast refresh:', error);
                    }
                }

                console.log('Token refreshed successfully');
            } else {
                // Refresh failed, check retry count
                refreshRetryCountRef.current++;

                if (refreshRetryCountRef.current < MAX_REFRESH_RETRIES) {
                    console.warn(`Token refresh failed, retrying (${refreshRetryCountRef.current}/${MAX_REFRESH_RETRIES})...`);
                    // Retry after delay
                    setTimeout(() => {
                        isRefreshingRef.current = false;
                        refreshToken();
                    }, REFRESH_RETRY_DELAY * refreshRetryCountRef.current);
                    return;
                } else {
                    // Max retries reached, clear session and logout
                    console.error('Max token refresh retries reached, logging out...');
                    await logout();
                }
            }
        } catch (error) {
            console.error('Token refresh error:', error);

            // Check retry count
            refreshRetryCountRef.current++;

            if (refreshRetryCountRef.current < MAX_REFRESH_RETRIES) {
                console.warn(`Token refresh error, retrying (${refreshRetryCountRef.current}/${MAX_REFRESH_RETRIES})...`);
                setTimeout(() => {
                    isRefreshingRef.current = false;
                    refreshToken();
                }, REFRESH_RETRY_DELAY * refreshRetryCountRef.current);
                return;
            } else {
                // Max retries reached, logout
                console.error('Max token refresh retries reached, logging out...');
                await logout();
            }
        } finally {
            isRefreshingRef.current = false;
        }
    }, []);

    // ============================================================================
    // SESSION TIMEOUT AND ACTIVITY TRACKING
    // ============================================================================

    /**
     * Update user activity timestamp
     * SECURITY: Tracks user activity to implement session timeout
     */
    const updateActivity = useCallback(() => {
        if (state.isAuthenticated) {
            const now = Date.now();
            dispatchRef.current({ type: 'AUTH_UPDATE_ACTIVITY', payload: now });

            // Broadcast activity to other tabs
            if (broadcastChannelRefForMessage.current) {
                try {
                    broadcastChannelRefForMessage.current.postMessage({ type: 'ACTIVITY', timestamp: now });
                } catch (error) {
                    console.warn('Failed to broadcast activity:', error);
                }
            }
        }
    }, [state.isAuthenticated]);

    /**
     * Extend session by updating activity timestamp
     * Called when user clicks "Extend Session" in warning dialog
     */
    const extendSession = useCallback(() => {
        updateActivity();
        dispatchRef.current({ type: 'AUTH_HIDE_SESSION_WARNING' });
        showSuccess('Sessão estendida com sucesso!');
    }, [updateActivity]);

    /**
     * Check for session timeout
     * SECURITY: Automatically logs out user after period of inactivity
     */
    const checkSessionTimeout = useCallback(() => {
        if (!state.isAuthenticated || !state.lastActivity) {
            return;
        }

        const now = Date.now();
        const timeSinceActivity = now - state.lastActivity;

        // Check if we should show warning
        const timeUntilTimeout = SESSION_TIMEOUT_DURATION - timeSinceActivity;

        if (timeUntilTimeout <= SESSION_WARNING_DURATION && timeUntilTimeout > 0 && !state.sessionWarningShown) {
            dispatchRef.current({ type: 'AUTH_SHOW_SESSION_WARNING' });
            showWarning(`Sua sessão expirará em ${Math.ceil(timeUntilTimeout / 60000)} minutos. Clique em qualquer lugar para estender.`);
        }

        // Check if session has expired
        if (timeSinceActivity >= SESSION_TIMEOUT_DURATION) {
            console.log('Session expired due to inactivity, logging out...');
            logout();
        }
    }, [state.isAuthenticated, state.lastActivity, state.sessionWarningShown]);

    /**
     * Setup activity tracking listeners
     * SECURITY: Monitors user activity across the application
     */
    const setupActivityTracking = useCallback(() => {
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click',
        ];

        // Add event listeners with throttling to avoid excessive updates
        let lastUpdate = 0;
        const throttleDelay = 1000; // Update at most once per second

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastUpdate > throttleDelay) {
                updateActivity();
                lastUpdate = now;
            }
        };

        activityEvents.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Return cleanup function
        return () => {
            activityEvents.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [updateActivity]);

    // ============================================================================
    // MULTI-TAB SESSION SYNCHRONIZATION
    // ============================================================================

    /**
     * Setup BroadcastChannel for real-time auth state updates across tabs
     * SECURITY: Ensures all tabs stay in sync with auth state
     */
    const setupBroadcastChannel = useCallback(() => {
        try {
            const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
            broadcastChannelRef.current = channel;
            broadcastChannelRefForMessage.current = channel;

            channel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
                const message = event.data;

                console.log('Received broadcast message:', message.type);

                switch (message.type) {
                    case 'LOGIN':
                        // Another tab logged in, refresh our session
                        if (!state.isAuthenticated) {
                            initializeAuth();
                        }
                        break;

                    case 'LOGOUT':
                        // Another tab logged out, logout here too
                        if (state.isAuthenticated) {
                            logout();
                        }
                        break;

                    case 'REFRESH':
                        // Another tab refreshed tokens, update our state
                        if (state.isAuthenticated) {
                            const storedSession = SupabaseAuthService.getStoredSession();
                            if (storedSession) {
                                dispatchRef.current({
                                    type: 'AUTH_REFRESH_TOKENS',
                                    payload: storedSession,
                                });
                            }
                        }
                        break;

                    case 'ACTIVITY':
                        // Another tab has activity, update our activity timestamp
                        if (state.isAuthenticated) {
                            dispatchRef.current({ type: 'AUTH_UPDATE_ACTIVITY', payload: message.timestamp });
                        }
                        break;
                }
            };

            return () => {
                channel.close();
            };
        } catch (error) {
            console.warn('BroadcastChannel not supported, falling back to storage events:', error);
        }
    }, [state.isAuthenticated]);

    /**
     * Setup storage event listener for cross-tab sync (fallback for BroadcastChannel)
     * SECURITY: Detects auth changes in other tabs via localStorage events
     */
    const setupStorageEventListener = useCallback(() => {
        const handleStorageChange = (event: StorageEvent) => {
            // Only handle events related to auth storage
            if (event.key === 'visulab_session' || event.key === 'visulab_user') {
                console.log('Storage event detected:', event.key, event.newValue);

                if (event.newValue === null) {
                    // Storage was cleared (logout in another tab)
                    if (state.isAuthenticated) {
                        logout();
                    }
                } else if (event.newValue && event.oldValue) {
                    // Storage was updated (login or refresh in another tab)
                    if (!state.isAuthenticated) {
                        initializeAuth();
                    }
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [state.isAuthenticated]);

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /**
     * Extract company name from email domain
     * Example: junior@amx.com -> Amx
     * Example: marcia@master.com -> Master
     */
    const extractCompanyFromEmail = (email: string): string => {
        try {
            // Extract domain from email (everything after @)
            const domain = email.split('@')[1];

            if (!domain) {
                return '';
            }

            // Remove common TLDs (.com, .br, .net, .org, etc.)
            const domainWithoutTld = domain.replace(/\.(com|br|net|org|gov|edu)$/i, '');

            // Capitalize company name (first letter uppercase, rest lowercase)
            return domainWithoutTld.charAt(0).toUpperCase() + domainWithoutTld.slice(1).toLowerCase();
        } catch (error) {
            console.error('Error extracting company from email:', error);
            return '';
        }
    };

    /**
     * Initialize auth state
     * FIX: Removed manual session validation that clears storage
     * Let Supabase handle session persistence internally
     */
    const initializeAuth = useCallback(async () => {
        try {
            dispatchRef.current({ type: 'AUTH_START_LOADING' });

            // FIX: Skip initialization if user is currently logging in
            if (isLoggingInRef.current) {
                console.log('Skipping initializeAuth - login in progress');
                dispatchRef.current({ type: 'AUTH_SET_INITIALIZED' });
                return;
            }

            // Check localStorage for stored session
            const storedSession = SupabaseAuthService.getStoredSession();
            const storedUser = SupabaseAuthService.getStoredUser();

            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] initializeAuth - Stored data:', {
                hasSession: !!storedSession,
                hasUser: !!storedUser,
                storedUser: storedUser ? {
                    id: storedUser.id,
                    email: storedUser.email,
                    empresa_id: (storedUser as any).empresa_id,
                    role: (storedUser as any).role,
                    company: (storedUser as any).company,
                    auth_user_id: (storedUser as any).auth_user_id
                } : null
            });

            if (storedSession && storedUser) {
                // FIX: Restore empresa_id from stored user
                const empresa_id = (storedUser as any).empresa_id;
                const role = (storedUser as any).role || 'Usuário';
                const company = (storedUser as any).company || extractCompanyFromEmail(storedUser.email);

                if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] initializeAuth - Restoring user:', {
                    id: storedUser.id,
                    email: storedUser.email,
                    empresa_id,
                    role,
                    company,
                    auth_user_id: (storedUser as any).auth_user_id
                });

                // Validate empresa_id for non-admin users
                if (role !== 'Administrador' && !empresa_id) {
                    console.error('❌ [AUTH ERROR] Non-admin user missing empresa_id in stored data:', {
                        userId: storedUser.id,
                        role: role
                    });
                    // Try to fetch empresa_id from database
                    try {
                        const { supabase } = await import('../../lib/supabase');
                        const { data: userData, error: fetchError } = await supabase
                            .from('usuarios')
                            .select('empresa_id, role, auth_user_id')
                            .eq('id', storedUser.id)
                            .single();

                        if (fetchError) {
                            console.error('❌ [AUTH ERROR] Failed to fetch empresa_id:', fetchError);
                            dispatchRef.current({ type: 'AUTH_SET_INITIALIZED' });
                            return;
                        }

                        if (!userData) {
                            console.error('❌ [AUTH ERROR] User not found in database');
                            dispatchRef.current({ type: 'AUTH_SET_INITIALIZED' });
                            return;
                        }

                        if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] initializeAuth - Fetched empresa_id and auth_user_id from database:', {
                            empresa_id: userData.empresa_id,
                            role: userData.role,
                            auth_user_id: userData.auth_user_id
                        });

                        // Update stored user with fetched data including auth_user_id
                        const updatedUser: AuthUser = {
                            ...storedUser,
                            empresa_id: userData.empresa_id,
                            role: userData.role || 'Usuário',
                            company: company,
                            auth_user_id: userData.auth_user_id
                        };

                        // Store updated user
                        SupabaseAuthService.storeUser(updatedUser);

                        // Dispatch with updated user
                        dispatchRef.current({
                            type: 'AUTH_LOGIN_SUCCESS',
                            payload: { user: updatedUser, tokens: storedSession },
                        });
                    } catch (error) {
                        console.error('❌ [AUTH ERROR] Failed to fetch empresa_id:', error);
                        dispatchRef.current({ type: 'AUTH_SET_INITIALIZED' });
                        return;
                    }
                } else {
                    // empresa_id exists or user is admin, proceed with stored data including auth_user_id
                    const userWithCompany: AuthUser = {
                        ...storedUser,
                        empresa_id: empresa_id,
                        role: role,
                        company: company,
                        auth_user_id: (storedUser as any).auth_user_id
                    };

                    if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] initializeAuth - User object ready:', {
                        id: userWithCompany.id,
                        email: userWithCompany.email,
                        empresa_id: userWithCompany.empresa_id,
                        role: userWithCompany.role,
                        company: userWithCompany.company,
                        auth_user_id: userWithCompany.auth_user_id
                    });

                    // FIX: Use stored session directly without validation
                    // Supabase handles session validation internally
                    dispatchRef.current({
                        type: 'AUTH_LOGIN_SUCCESS',
                        payload: { user: userWithCompany, tokens: storedSession },
                    });
                }

                console.log('Auth initialized successfully from storage');
                return;
            }

            // No valid session found
            dispatchRef.current({ type: 'AUTH_SET_INITIALIZED' });
        } catch (error) {
            console.error('Error initializing auth:', error);
            // FIX: Don't clear storage on initialization errors
            // Only clear on explicit logout
            dispatchRef.current({ type: 'AUTH_SET_INITIALIZED' });
        }
    }, []); // Empty dependency array - initializeAuth should only run once

    // ============================================================================
    // AUTH ACTIONS
    // ============================================================================

    /**
     * Login function with multi-tab sync
     */
    const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
        if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Login called with email:', credentials.email);

        // FIX: Set login flag to prevent onAuthStateChange from interfering
        isLoggingInRef.current = true;

        try {
            dispatchRef.current({ type: 'AUTH_START_LOADING' });

            const session = await supabaseAuthService.signIn(credentials);

            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Login successful, session:', {
                userId: session.user.id,
                email: session.user.email,
                expiresAt: new Date(session.expiresAt).toISOString()
            });

            // Fetch user's empresa_id, role, and auth_user_id from usuarios table
            const { supabase } = await import('../../lib/supabase');
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('empresa_id, role, auth_user_id')
                .eq('id', session.user.id)
                .single();

            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] User data fetched:', {
                userData,
                userError,
                empresa_id: userData?.empresa_id,
                role: userData?.role,
                auth_user_id: userData?.auth_user_id
            });

            if (userError) {
                console.error('❌ [AUTH ERROR] Failed to fetch user data:', userError);
                throw new Error(`Failed to fetch user data: ${userError.message}`);
            }

            if (!userData) {
                console.error('❌ [AUTH ERROR] User data not found in usuarios table');
                throw new Error('User data not found. Please contact administrator.');
            }

            // Validate empresa_id for non-admin users
            const role = userData.role || 'Usuário';

            console.log('🔍 [AUTH LOGIN] User data fetched from database:', {
                userId: session.user.id,
                email: session.user.email,
                role: role,
                empresa_id: userData.empresa_id,
                auth_user_id: userData.auth_user_id,
                isAdmin: role === 'Administrador'
            });

            if (role !== 'Administrador' && !userData.empresa_id) {
                console.error('❌ [AUTH ERROR] Non-admin user missing empresa_id:', {
                    userId: session.user.id,
                    role: role
                });
                throw new Error('User is not assigned to a company. Please contact administrator.');
            }

            // Update last_active timestamp to track user's last login
            try {
                await usuariosService.updateLastActive(session.user.id);
            } catch (error) {
                console.warn('⚠️ [AUTH WARNING] Failed to update last_active timestamp:', error);
                // Don't fail login if this fails - it's a non-critical operation
            }

            // Include empresa_id, role, company, and auth_user_id in user object
            const userWithEmpresa = {
                ...session.user,
                empresa_id: userData.empresa_id,
                role: role,
                company: extractCompanyFromEmail(session.user.email), // Extract company from email domain
                auth_user_id: userData.auth_user_id
            };

            console.log('🔍 [AUTH LOGIN] User object created:', {
                id: userWithEmpresa.id,
                email: userWithEmpresa.email,
                empresa_id: userWithEmpresa.empresa_id,
                role: userWithEmpresa.role,
                company: userWithEmpresa.company
            });

            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] User object created:', {
                id: userWithEmpresa.id,
                email: userWithEmpresa.email,
                empresa_id: userWithEmpresa.empresa_id,
                role: userWithEmpresa.role,
                company: userWithEmpresa.company,
                auth_user_id: userWithEmpresa.auth_user_id
            });

            dispatchRef.current({
                type: 'AUTH_LOGIN_SUCCESS',
                payload: { user: userWithEmpresa, tokens: session },
            });

            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] AUTH_LOGIN_SUCCESS dispatched');

            // Broadcast login to other tabs
            if (broadcastChannelRefForMessage.current) {
                try {
                    broadcastChannelRefForMessage.current.postMessage({ type: 'LOGIN', timestamp: Date.now() });
                } catch (error) {
                    console.warn('Failed to broadcast login:', error);
                }
            }

            showSuccess('Login realizado com sucesso!');
        } catch (error) {
            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Login failed with error:', error);
            dispatchRef.current({ type: 'AUTH_STOP_LOADING' });
            throw error;
        } finally {
            // FIX: Clear login flag after a short delay to allow onAuthStateChange to process SIGNED_IN
            setTimeout(() => {
                isLoggingInRef.current = false;
                if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Login flag cleared');
            }, 1000);
        }
    }, []);

    /**
     * Logout function with multi-tab sync
     */
    const logout = useCallback(async (): Promise<void> => {
        if (DEBUG_AUTH) {
            console.log('🔍 [AUTH DEBUG] Logout called');
        }

        try {
            // Clear all timers
            if (tokenRefreshTimerRef.current) {
                clearTimeout(tokenRefreshTimerRef.current);
            }
            if (sessionTimeoutTimerRef.current) {
                clearTimeout(sessionTimeoutTimerRef.current);
            }
            if (activityCheckTimerRef.current) {
                clearInterval(activityCheckTimerRef.current);
            }

            await supabaseAuthService.signOut();
            dispatchRef.current({ type: 'AUTH_LOGOUT' });

            // Broadcast logout to other tabs
            if (broadcastChannelRefForMessage.current) {
                try {
                    broadcastChannelRefForMessage.current.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
                } catch (error) {
                    console.warn('Failed to broadcast logout:', error);
                }
            }

            showWarning('Você foi desconectado.');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }, []);

    /**
     * Update profile function
     */
    const updateProfile = useCallback(async (data: Partial<AuthUser>): Promise<void> => {
        try {
            dispatchRef.current({ type: 'AUTH_START_LOADING' });

            const currentUser = await supabaseAuthService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            // Import supabase client
            const { supabase } = await import('../../lib/supabase');

            // Update user metadata in Supabase
            const { error } = await supabase.auth.updateUser({
                data: {
                    name: data.name,
                    role: data.role,
                    avatar_url: data.avatarUrl,
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            const updatedUser = { ...currentUser, ...data };

            dispatchRef.current({
                type: 'AUTH_UPDATE_USER',
                payload: updatedUser,
            });

            // Update stored user
            SupabaseAuthService.storeUser(updatedUser);

            showSuccess('Perfil atualizado com sucesso!');
        } catch (error) {
            dispatchRef.current({ type: 'AUTH_STOP_LOADING' });
            throw error;
        }
    }, []);

    /**
     * Update password function
     */
    const updatePassword = useCallback(async (password: string): Promise<void> => {
        try {
            dispatchRef.current({ type: 'AUTH_START_LOADING' });

            await supabaseAuthService.updatePassword(password);

            dispatchRef.current({ type: 'AUTH_STOP_LOADING' });

            showSuccess('Senha atualizada com sucesso!');
        } catch (error) {
            dispatchRef.current({ type: 'AUTH_STOP_LOADING' });
            throw error;
        }
    }, []);

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    const hasRole = (role: string): boolean => {
        return state.user?.role === role;
    };

    const hasPermission = (permission: string): boolean => {
        // This will be implemented based on the user's role and permissions
        // For now, admin users have all permissions
        return state.user?.role === 'Administrador';
    };

    /**
     * Validate current session
     * Used by ProtectedRoute to ensure session is valid on server side
     */
    const validateSession = useCallback(async (): Promise<boolean> => {
        try {
            const session = await supabaseAuthService.getCurrentSession();
            return !!session;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }, []);

    // ============================================================================
    // EFFECTS
    // ============================================================================

    // Initialize auth on mount
    useEffect(() => {
        initializeAuth();
    }, []); // Empty dependency array - initialize only once on mount

    // Setup multi-tab sync
    useEffect(() => {
        const cleanupBroadcast = setupBroadcastChannel();
        const cleanupStorage = setupStorageEventListener();

        return () => {
            cleanupBroadcast?.();
            cleanupStorage?.();
        };
    }, [setupBroadcastChannel, setupStorageEventListener]);

    // Setup activity tracking when authenticated
    useEffect(() => {
        if (state.isAuthenticated) {
            const cleanup = setupActivityTracking();

            // Start periodic session timeout check
            activityCheckTimerRef.current = setInterval(() => {
                checkSessionTimeout();
            }, 60000); // Check every minute

            return () => {
                cleanup();
                if (activityCheckTimerRef.current) {
                    clearInterval(activityCheckTimerRef.current);
                }
            };
        }
    }, [state.isAuthenticated, setupActivityTracking, checkSessionTimeout]);

    // Schedule token refresh when tokens change
    useEffect(() => {
        if (state.isAuthenticated && state.tokens) {
            scheduleTokenRefresh();
        }
    }, [state.isAuthenticated, state.tokens, scheduleTokenRefresh]);

    // Listen to auth state changes from Supabase (fallback mechanism)
    // FIX: Register listener ONLY ONCE on mount to prevent infinite loop
    // Remove all state dependencies to prevent re-registration
    useEffect(() => {
        if (DEBUG_AUTH) {
            console.log('🔍 [AUTH DEBUG] onAuthStateChange effect RUNNING - setting up listener (ONCE)');
        }

        const unsubscribe = supabaseAuthService.onAuthStateChange(async (session: AuthSession | null) => {
            if (DEBUG_AUTH) {
                console.log('🔍 [AUTH DEBUG] Supabase auth state change detected:', session ? 'SIGNED_IN' : 'SIGNED_OUT');
                console.log('🔍 [AUTH DEBUG] Session data:', session ? {
                    userId: session.user.id,
                    email: session.user.email,
                    expiresAt: new Date(session.expiresAt).toISOString()
                } : null);
            }

            if (session) {
                // FIX: Fetch empresa_id, role, and auth_user_id from database for onAuthStateChange
                const { supabase } = await import('../../lib/supabase');
                const { data: userData, error: userError } = await supabase
                    .from('usuarios')
                    .select('empresa_id, role, auth_user_id')
                    .eq('id', session.user.id)
                    .single();

                if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] onAuthStateChange - User data fetched:', {
                    userData,
                    userError,
                    empresa_id: userData?.empresa_id,
                    role: userData?.role,
                    auth_user_id: userData?.auth_user_id
                });

                if (userError) {
                    console.error('❌ [AUTH ERROR] Failed to fetch user data in onAuthStateChange:', userError);
                }

                // Extract company from email and auth_user_id for onAuthStateChange
                const userWithCompany: AuthUser = {
                    ...session.user,
                    empresa_id: userData?.empresa_id,
                    role: userData?.role || 'Usuário',
                    company: (session.user as any).company || extractCompanyFromEmail(session.user.email),
                    auth_user_id: userData?.auth_user_id
                };

                if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] onAuthStateChange - User object created:', {
                    id: userWithCompany.id,
                    email: userWithCompany.email,
                    empresa_id: userWithCompany.empresa_id,
                    role: userWithCompany.role,
                    company: userWithCompany.company,
                    auth_user_id: userWithCompany.auth_user_id
                });

                dispatchRef.current({
                    type: 'AUTH_LOGIN_SUCCESS',
                    payload: { user: userWithCompany, tokens: session },
                });

                if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Dispatched AUTH_LOGIN_SUCCESS from onAuthStateChange');
            } else {
                // FIX: Only dispatch logout if not currently logging in
                // This prevents race condition where onAuthStateChange fires during login
                if (!isLoggingInRef.current) {
                    if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Dispatching AUTH_LOGOUT due to null session');
                    dispatchRef.current({ type: 'AUTH_LOGOUT' });
                } else {
                    if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] Skipping AUTH_LOGOUT - login in progress');
                }
            }
        });

        return () => {
            if (DEBUG_AUTH) console.log('🔍 [AUTH DEBUG] onAuthStateChange effect CLEANUP - unsubscribing');
            unsubscribe();
        };
    }, []); // Empty dependency array - register ONCE on mount

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear all timers
            if (tokenRefreshTimerRef.current) {
                clearTimeout(tokenRefreshTimerRef.current);
            }
            if (sessionTimeoutTimerRef.current) {
                clearTimeout(sessionTimeoutTimerRef.current);
            }
            if (activityCheckTimerRef.current) {
                clearInterval(activityCheckTimerRef.current);
            }

            // Close broadcast channel
            if (broadcastChannelRef.current) {
                broadcastChannelRef.current.close();
            }
        };
    }, []);

    // ============================================================================
    // CONTEXT VALUE
    // ============================================================================

    const value: AuthContextType = {
        // State
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        isInitialized: state.isInitialized,
        lastActivity: state.lastActivity,
        sessionWarningShown: state.sessionWarningShown,

        // Actions
        login,
        logout,
        updateProfile,
        updatePassword,
        refreshToken,
        extendSession,

        // Utilities
        hasRole,
        hasPermission,
        validateSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Hook to require authentication
 */
export const requireAuth = (): AuthUser => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated || !user) {
        throw new Error('Authentication required');
    }

    return user;
};

/**
 * Hook to require specific role
 */
export const requireRole = (role: string): AuthUser => {
    const user = requireAuth();
    const { hasRole } = useAuth();

    if (!hasRole(role)) {
        throw new Error(`Role '${role}' required`);
    }

    return user;
};

export default AuthContext;
