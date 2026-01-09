/**
 * ProtectedRoute Unit Tests
 * Tests for role-based access control improvements including:
 * - Authentication check
 * - Role-based access (requiredRoles)
 * - Permission-based access (requiredPermissions)
 * - Fallback path redirect
 * - Loading states
 * - Timeout handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AccessDenied } from '@/components/auth/AccessDenied';

// ============================================================================
// MOCKS
// ============================================================================

// Mock useAuth hook
const mockUseAuth = vi.fn();

vi.mock('@/hooks/auth/useAuth', () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock LoadingSpinner
vi.mock('@/components/ui/loading/LoadingSpinner', () => ({
    LoadingSpinner: ({ size }: { size?: string }) => (
        <div data-testid="loading-spinner" data-size={size}>
            Loading...
        </div>
    ),
}));

// Mock AccessDenied
vi.mock('@/components/auth/AccessDenied', () => ({
    AccessDenied: ({ requiredRoles, requiredPermissions, message, dashboardPath, details }: any) => (
        <div data-testid="access-denied">
            <div data-testid="required-roles">{JSON.stringify(requiredRoles)}</div>
            <div data-testid="required-permissions">{JSON.stringify(requiredPermissions)}</div>
            <div data-testid="message">{message}</div>
            <div data-testid="dashboard-path">{dashboardPath}</div>
            <div data-testid="details">{details}</div>
        </div>
    ),
}));

// ============================================================================
// TEST SETUP
// ============================================================================

const createWrapper = (initialEntries = ['/']) => {
    return ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path="/" element={<div>Home</div>} />
                <Route path="/dashboard" element={<div>Dashboard</div>} />
                <Route path="/protected" element={<ProtectedRoute>{children}</ProtectedRoute>} />
                <Route path="/unauthorized" element={<div>Unauthorized</div>} />
            </Routes>
        </MemoryRouter>
    );
};

beforeEach(() => {
    mockUseAuth.mockReturnValue({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        lastActivity: null,
        sessionWarningShown: false,
        login: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
        refreshToken: vi.fn(),
        validateSession: vi.fn(),
        extendSession: vi.fn(),
        hasRole: vi.fn(() => false),
        hasPermission: vi.fn(() => false),
    });
});

// ============================================================================
// TESTS
// ============================================================================

describe('ProtectedRoute - Authentication Check', () => {
    it('should redirect to login when not authenticated', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(false),
            logout: vi.fn(),
            hasRole: vi.fn(() => false),
            hasPermission: vi.fn(() => false),
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });
    });

    it('should show loading while validating session', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn(),
            logout: vi.fn(),
            hasRole: vi.fn(() => false),
            hasPermission: vi.fn(() => false),
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should logout when session validation fails', async () => {
        const logoutMock = vi.fn();
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(false),
            logout: logoutMock,
            hasRole: vi.fn(() => true),
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(logoutMock).toHaveBeenCalled();
        });
    });

    it('should render children when authenticated and session is valid', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: vi.fn(() => true),
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });
});

describe('ProtectedRoute - Role-Based Access', () => {
    it('should allow access when user has required role', async () => {
        const hasRoleMock = vi.fn((role: string) => role === 'Administrador');
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute requiredRoles={['Administrador']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    it('should deny access when user lacks required role', async () => {
        const hasRoleMock = vi.fn(() => false);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute requiredRoles={['Administrador']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        });
    });

    it('should allow access when user has at least one of multiple required roles', async () => {
        const hasRoleMock = vi.fn((role: string) => role === 'Gerente');
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    it('should allow access when no roles are required', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: vi.fn(() => false),
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });
});

describe('ProtectedRoute - Permission-Based Access', () => {
    it('should allow access when user has all required permissions', async () => {
        const hasPermissionMock = vi.fn((permission: string) => true);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: vi.fn(() => true),
            hasPermission: hasPermissionMock,
        });

        render(
            <ProtectedRoute requiredPermissions={['users:read', 'users:write']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    it('should deny access when user lacks required permission', async () => {
        const hasPermissionMock = vi.fn((permission: string) => permission !== 'users:delete');
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: vi.fn(() => true),
            hasPermission: hasPermissionMock,
        });

        render(
            <ProtectedRoute requiredPermissions={['users:read', 'users:delete']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        });
    });

    it('should allow access when no permissions are required', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: vi.fn(() => true),
            hasPermission: vi.fn(() => false),
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });
});

describe('ProtectedRoute - Combined Role and Permission Access', () => {
    it('should require both role and permission when both are specified', async () => {
        const hasRoleMock = vi.fn(() => true);
        const hasPermissionMock = vi.fn((permission: string) => permission === 'users:read');
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: hasPermissionMock,
        });

        render(
            <ProtectedRoute
                requiredRoles={['Administrador']}
                requiredPermissions={['users:read', 'users:write']}
            >
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        });
    });

    it('should allow access when both role and permission requirements are met', async () => {
        const hasRoleMock = vi.fn(() => true);
        const hasPermissionMock = vi.fn(() => true);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: hasPermissionMock,
        });

        render(
            <ProtectedRoute
                requiredRoles={['Administrador']}
                requiredPermissions={['users:read']}
            >
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });
});

describe('ProtectedRoute - Fallback Path Redirect', () => {
    it('should use default fallback path when access is denied', async () => {
        const hasRoleMock = vi.fn(() => false);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute requiredRoles={['Administrador']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            const accessDenied = screen.getByTestId('access-denied');
            expect(accessDenied).toBeInTheDocument();
            expect(screen.getByTestId('dashboard-path')).toHaveTextContent('/dashboard');
        });
    });

    it('should use custom fallback path when provided', async () => {
        const hasRoleMock = vi.fn(() => false);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute
                requiredRoles={['Administrador']}
                fallbackPath="/unauthorized"
            >
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            const accessDenied = screen.getByTestId('access-denied');
            expect(accessDenied).toBeInTheDocument();
            expect(screen.getByTestId('dashboard-path')).toHaveTextContent('/unauthorized');
        });
    });
});

describe('ProtectedRoute - Loading States', () => {
    it('should show loading when auth is loading', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isInitialized: false,
            isLoading: true,
            validateSession: vi.fn(),
            logout: vi.fn(),
            hasRole: vi.fn(() => false),
            hasPermission: vi.fn(() => false),
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show loading while validating session', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn(),
            logout: vi.fn(),
            hasRole: vi.fn(() => true),
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show loading while checking access', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: vi.fn(() => true),
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute requiredRoles={['Administrador']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
});

describe('ProtectedRoute - Timeout Handling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should timeout access check after specified time', async () => {
        const hasRoleMock = vi.fn(() => {
            // Never resolve
            return new Promise(() => { });
        });
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute
                requiredRoles={['Administrador']}
                checkTimeout={1000}
            >
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        // Wait for timeout
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await waitFor(() => {
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        });
    });

    it('should use default timeout when not specified', async () => {
        const hasRoleMock = vi.fn(() => {
            // Never resolve
            return new Promise(() => { });
        });
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute requiredRoles={['Administrador']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        // Wait for default timeout (5000ms)
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        });
    });
});

describe('ProtectedRoute - AccessDenied Props', () => {
    it('should pass requiredRoles to AccessDenied', async () => {
        const hasRoleMock = vi.fn(() => false);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            const accessDenied = screen.getByTestId('access-denied');
            expect(accessDenied).toBeInTheDocument();
            expect(screen.getByTestId('required-roles')).toHaveTextContent(
                JSON.stringify(['Administrador', 'Gerente'])
            );
        });
    });

    it('should pass requiredPermissions to AccessDenied', async () => {
        const hasPermissionMock = vi.fn(() => false);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: vi.fn(() => true),
            hasPermission: hasPermissionMock,
        });

        render(
            <ProtectedRoute requiredPermissions={['users:read', 'users:write']}>
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            const accessDenied = screen.getByTestId('access-denied');
            expect(accessDenied).toBeInTheDocument();
            expect(screen.getByTestId('required-permissions')).toHaveTextContent(
                JSON.stringify(['users:read', 'users:write'])
            );
        });
    });

    it('should pass custom message to AccessDenied', async () => {
        const hasRoleMock = vi.fn(() => false);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute
                requiredRoles={['Administrador']}
                accessDeniedMessage="Custom access denied message"
            >
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            const accessDenied = screen.getByTestId('access-denied');
            expect(accessDenied).toBeInTheDocument();
            expect(screen.getByTestId('message')).toHaveTextContent('Custom access denied message');
        });
    });

    it('should pass details to AccessDenied', async () => {
        const hasRoleMock = vi.fn(() => false);
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            validateSession: vi.fn().mockResolvedValue(true),
            logout: vi.fn(),
            hasRole: hasRoleMock,
            hasPermission: vi.fn(() => true),
        });

        render(
            <ProtectedRoute
                requiredRoles={['Administrador']}
                accessDeniedDetails="Additional details about why access was denied"
            >
                <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>,
            { wrapper: createWrapper(['/protected']) }
        );

        await waitFor(() => {
            const accessDenied = screen.getByTestId('access-denied');
            expect(accessDenied).toBeInTheDocument();
            expect(screen.getByTestId('details')).toHaveTextContent(
                'Additional details about why access was denied'
            );
        });
    });
});
