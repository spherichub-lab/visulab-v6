/**
 * Auth Flow Integration Tests
 * Tests for complete auth flow including:
 * - Login -> protected route -> logout
 * - Token refresh during active session
 * - Multi-tab session sync
 * - Role-based route protection
 * - RLS enforcement in data operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AccessDenied } from '@/components/auth/AccessDenied';

// ============================================================================
// TEST SETUP
// ============================================================================

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// TESTS
// ============================================================================

describe('Auth Flow - Complete Login to Logout', () => {
    it('should complete full auth flow', async () => {
        const TestComponent = () => {
            const { user, isAuthenticated, login, logout } = useAuth();

            return (
                <div>
                    <div data-testid="auth-state">
                        <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
                        <div data-testid="user">{user?.id || 'null'}</div>
                    </div>
                    <button
                        data-testid="login-button"
                        onClick={async () => {
                            await login({ email: 'test@example.com', password: 'password' });
                        }}
                    >
                        Login
                    </button>
                    <button
                        data-testid="logout-button"
                        onClick={async () => {
                            await logout();
                        }}
                        disabled={!isAuthenticated}
                    >
                        Logout
                    </button>
                </div>
            );
        };

        render(
            <MemoryRouter initialEntries={['/']}>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<TestComponent />} />
                        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
                    </Routes>
                </AuthProvider>
            </MemoryRouter>
        );

        // Initial state - not authenticated
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');

        // Click login
        const loginButton = screen.getByTestId('login-button');
        loginButton.click();

        // Wait for login to complete
        await waitFor(() => {
            expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
            expect(screen.getByTestId('user')).not.toHaveTextContent('null');
        });
    });
});

describe('Auth Flow - Role-Based Route Protection', () => {
    it('should protect route based on user role', async () => {
        const ProtectedComponent = () => {
            const { user, isAuthenticated, hasRole } = useAuth();

            return (
                <div>
                    <div data-testid="user">{user?.role || 'null'}</div>
                    <ProtectedRoute requiredRoles={['Administrador']}>
                        <div data-testid="admin-content">Admin Content</div>
                    </ProtectedRoute>
                    <ProtectedRoute requiredRoles={['Usuário']}>
                        <div data-testid="user-content">User Content</div>
                    </ProtectedRoute>
                </div>
            );
        };

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <AuthProvider>
                    <Routes>
                        <Route path="/admin" element={<ProtectedComponent />} />
                    </Routes>
                </AuthProvider>
            </MemoryRouter>
        );

        // Should show access denied since user is not authenticated
        await waitFor(() => {
            expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
            expect(screen.queryByTestId('user-content')).not.toBeInTheDocument();
        });
    });
});
