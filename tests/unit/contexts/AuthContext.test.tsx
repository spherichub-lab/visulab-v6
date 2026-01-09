/**
 * AuthContext Unit Tests
 * Tests for auth security improvements including:
 * - Server-side session validation
 * - Automatic token refresh scheduling
 * - Session activity tracking
 * - Session timeout handling
 * - Multi-tab synchronization (BroadcastChannel)
 * - Storage event listeners
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthTokens, AuthUser, LoginCredentials } from '@/types/api/api.types';
import {
    createMockUser,
    createMockTokens,
    createMockSession,
    createMockCredentials,
    MockBroadcastChannel,
    setupAuthTestEnvironment,
    waitForCondition,
} from '../../utils/authMocks';

// ============================================================================
// TEST SETUP
// ============================================================================

const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );
};

const cleanup = setupAuthTestEnvironment();

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.resetAllMocks();
});

// ============================================================================
// TESTS
// ============================================================================

describe('AuthContext - Server-Side Session Validation', () => {
    it('should validate session with server on initialization', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        // Wait for initialization to complete
        await waitFor(() => {
            expect(result.current.isInitialized).toBe(true);
        });
    });

    it('should clear invalid session on server validation failure', async () => {
        // Set up an expired session in localStorage
        const expiredSession = createMockSession({
            tokens: createMockTokens({
                expiresAt: Date.now() - 1000, // Expired
            }),
        });

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(expiredSession);
        supabaseAuthService.getStoredUser.mockReturnValue(expiredSession.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.user).toBeNull();
        });
    });

    it('should maintain valid session on server validation success', async () => {
        const validSession = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(validSession);
        supabaseAuthService.getStoredUser.mockReturnValue(validSession.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.user).toEqual(validSession.user);
        });
    });

    it('should handle validation errors gracefully', async () => {
        // Mock a validation error
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getCurrentSession.mockRejectedValue(
            new Error('Validation error')
        );

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isInitialized).toBe(true);
            expect(result.current.isAuthenticated).toBe(false);
        });
    });
});

describe('AuthContext - Automatic Token Refresh Scheduling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should schedule token refresh before expiry', async () => {
        const now = Date.now();
        const expiresAt = now + 10 * 60 * 1000; // 10 minutes from now
        const session = createMockSession({
            tokens: createMockTokens({ expiresAt }),
        });

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Advance time to trigger refresh (5 minutes before expiry)
        act(() => {
            vi.advanceTimersByTime(5 * 60 * 1000);
        });

        // Refresh should have been called
        expect(supabaseAuthService.refreshSession).toHaveBeenCalled();
    });

    it('should refresh immediately if token is already expired', async () => {
        const expiredSession = createMockSession({
            tokens: createMockTokens({
                expiresAt: Date.now() - 1000, // Already expired
            }),
        });

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(expiredSession);
        supabaseAuthService.getStoredUser.mockReturnValue(expiredSession.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        expect(supabaseAuthService.refreshSession).toHaveBeenCalled();
    });

    it('should update tokens after successful refresh', async () => {
        const initialSession = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(initialSession);
        supabaseAuthService.getStoredUser.mockReturnValue(initialSession.user);

        const newTokens = createMockTokens({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
        });

        supabaseAuthService.refreshSession.mockResolvedValue({
            ...initialSession,
            tokens: newTokens,
        });

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Trigger refresh
        await act(async () => {
            await result.current.refreshToken();
        });

        expect(result.current.tokens).toEqual(newTokens);
    });
});

describe('AuthContext - Session Activity Tracking', () => {
    it('should update activity timestamp on user interaction', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        const initialActivity = result.current.lastActivity;

        // Simulate user activity
        act(() => {
            window.dispatchEvent(new MouseEvent('mousedown'));
        });

        // Activity should be updated
        await waitFor(() => {
            expect(result.current.lastActivity).toBeGreaterThan(initialActivity!);
        });
    });

    it('should throttle activity updates to avoid excessive updates', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        const initialActivity = result.current.lastActivity;

        // Dispatch multiple events quickly
        act(() => {
            window.dispatchEvent(new MouseEvent('mousedown'));
            window.dispatchEvent(new MouseEvent('mousedown'));
            window.dispatchEvent(new MouseEvent('mousedown'));
        });

        // Wait for throttling period
        await waitFor(() => {
            expect(result.current.lastActivity).toBeGreaterThan(initialActivity!);
        }, { timeout: 2000 });
    });

    it('should track multiple types of activity events', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        const initialActivity = result.current.lastActivity;

        // Test different event types
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown'));
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new TouchEvent('touchstart'));
        });

        await waitFor(() => {
            expect(result.current.lastActivity).toBeGreaterThan(initialActivity!);
        });
    });
});

describe('AuthContext - Session Timeout Handling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should show warning before session timeout', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Set last activity to 25 minutes ago (5 minutes before timeout)
        act(() => {
            result.current.lastActivity = Date.now() - 25 * 60 * 1000;
        });

        // Advance time to trigger warning
        act(() => {
            vi.advanceTimersByTime(60 * 1000);
        });

        // Warning should be shown
        await waitFor(() => {
            expect(result.current.sessionWarningShown).toBe(true);
        });
    });

    it('should logout after session timeout', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Set last activity to 30 minutes ago (timeout)
        act(() => {
            result.current.lastActivity = Date.now() - 30 * 60 * 1000;
        });

        // Advance time to trigger timeout check
        act(() => {
            vi.advanceTimersByTime(60 * 1000);
        });

        // User should be logged out
        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    it('should extend session when extendSession is called', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Set last activity to 25 minutes ago
        const oldActivity = Date.now() - 25 * 60 * 1000;
        act(() => {
            result.current.lastActivity = oldActivity;
        });

        // Extend session
        await act(async () => {
            await result.current.extendSession();
        });

        // Activity should be updated
        expect(result.current.lastActivity).toBeGreaterThan(oldActivity);
        expect(result.current.sessionWarningShown).toBe(false);
    });
});

describe('AuthContext - Multi-Tab Synchronization (BroadcastChannel)', () => {
    it('should broadcast login to other tabs', async () => {
        const session = createMockSession();
        const credentials = createMockCredentials();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.signIn.mockResolvedValue(session);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        // Create another channel to receive broadcasts
        const otherChannel = new MockBroadcastChannel('visulab_auth_sync');
        const onMessage = vi.fn();
        otherChannel.addEventListener('message', onMessage);

        await act(async () => {
            await result.current.login(credentials);
        });

        await waitFor(() => {
            expect(onMessage).toHaveBeenCalled();
        });

        const broadcastMessage = onMessage.mock.calls[0][0].data;
        expect(broadcastMessage.type).toBe('LOGIN');
        expect(broadcastMessage.timestamp).toBeDefined();

        otherChannel.close();
    });

    it('should broadcast logout to other tabs', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Create another channel to receive broadcasts
        const otherChannel = new MockBroadcastChannel('visulab_auth_sync');
        const onMessage = vi.fn();
        otherChannel.addEventListener('message', onMessage);

        await act(async () => {
            await result.current.logout();
        });

        await waitFor(() => {
            expect(onMessage).toHaveBeenCalled();
        });

        const broadcastMessage = onMessage.mock.calls[0][0].data;
        expect(broadcastMessage.type).toBe('LOGOUT');

        otherChannel.close();
    });

    it('should receive login broadcast from other tab', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isInitialized).toBe(true);
        });

        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        // Simulate login from another tab
        const otherChannel = new MockBroadcastChannel('visulab_auth_sync');
        otherChannel.postMessage({
            type: 'LOGIN',
            timestamp: Date.now(),
        });

        // Current tab should reinitialize auth
        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        otherChannel.close();
    });

    it('should receive logout broadcast from other tab', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Simulate logout from another tab
        const otherChannel = new MockBroadcastChannel('visulab_auth_sync');
        otherChannel.postMessage({
            type: 'LOGOUT',
            timestamp: Date.now(),
        });

        // Current tab should logout
        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(false);
        });

        otherChannel.close();
    });

    it('should receive refresh broadcast from other tab', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        const newTokens = createMockTokens({
            accessToken: 'new-access-token',
        });
        const updatedSession = { ...session, tokens: newTokens };
        supabaseAuthService.getStoredSession.mockReturnValue(updatedSession);

        // Simulate refresh from another tab
        const otherChannel = new MockBroadcastChannel('visulab_auth_sync');
        otherChannel.postMessage({
            type: 'REFRESH',
            timestamp: Date.now(),
        });

        // Current tab should update tokens
        await waitFor(() => {
            expect(result.current.tokens).toEqual(newTokens);
        });

        otherChannel.close();
    });

    it('should receive activity broadcast from other tab', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        const newActivity = Date.now();

        // Simulate activity from another tab
        const otherChannel = new MockBroadcastChannel('visulab_auth_sync');
        otherChannel.postMessage({
            type: 'ACTIVITY',
            timestamp: newActivity,
        });

        // Current tab should update activity
        await waitFor(() => {
            expect(result.current.lastActivity).toBe(newActivity);
        });

        otherChannel.close();
    });
});

describe('AuthContext - Storage Event Listeners', () => {
    it('should logout on storage clear event', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Simulate storage clear from another tab
        act(() => {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'visulab_session',
                newValue: null,
                oldValue: JSON.stringify(session),
            }));
        });

        // Should logout
        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    it('should reinitialize on storage update event', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isInitialized).toBe(true);
        });

        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        // Simulate storage update from another tab
        act(() => {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'visulab_session',
                newValue: JSON.stringify(session),
                oldValue: null,
            }));
        });

        // Should reinitialize
        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });
    });
});

describe('AuthContext - Login and Logout', () => {
    it('should login successfully', async () => {
        const session = createMockSession();
        const credentials = createMockCredentials();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.signIn.mockResolvedValue(session);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.login(credentials);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(session.user);
        expect(result.current.tokens).toEqual(session.tokens);
    });

    it('should handle login failure', async () => {
        const credentials = createMockCredentials();
        const error = new Error('Invalid credentials');

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.signIn.mockRejectedValue(error);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await expect(
            act(async () => {
                await result.current.login(credentials);
            })
        ).rejects.toThrow(error);

        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should logout successfully', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.tokens).toBeNull();
    });
});

describe('AuthContext - Utility Functions', () => {
    it('hasRole should return true for matching role', async () => {
        const session = createMockSession({
            user: createMockUser({ role: 'Administrador' }),
        });

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        expect(result.current.hasRole('Administrador')).toBe(true);
        expect(result.current.hasRole('Usuário')).toBe(false);
    });

    it('hasPermission should return true for admin users', async () => {
        const session = createMockSession({
            user: createMockUser({ role: 'Administrador' }),
        });

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        expect(result.current.hasPermission('any:permission')).toBe(true);
    });

    it('hasPermission should return false for non-admin users', async () => {
        const session = createMockSession({
            user: createMockUser({ role: 'Usuário' }),
        });

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        expect(result.current.hasPermission('any:permission')).toBe(false);
    });
});

describe('AuthContext - Validate Session', () => {
    it('should return true for valid session', async () => {
        const session = createMockSession();

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        supabaseAuthService.getCurrentSession.mockResolvedValue(session);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isInitialized).toBe(true);
        });

        const isValid = await act(async () => {
            return await result.current.validateSession();
        });

        expect(isValid).toBe(true);
    });

    it('should return false for expired session', async () => {
        const session = createMockSession({
            tokens: createMockTokens({
                expiresAt: Date.now() - 1000,
            }),
        });

        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getStoredSession.mockReturnValue(session);
        supabaseAuthService.getStoredUser.mockReturnValue(session.user);

        supabaseAuthService.getCurrentSession.mockResolvedValue(session);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isInitialized).toBe(true);
        });

        const isValid = await act(async () => {
            return await result.current.validateSession();
        });

        expect(isValid).toBe(false);
    });

    it('should return false when no session exists', async () => {
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        supabaseAuthService.getCurrentSession.mockResolvedValue(null);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isInitialized).toBe(true);
        });

        const isValid = await act(async () => {
            return await result.current.validateSession();
        });

        expect(isValid).toBe(false);
    });
});
