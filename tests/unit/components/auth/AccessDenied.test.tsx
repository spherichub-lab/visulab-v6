/**
 * AccessDenied Unit Tests
 * Tests for AccessDenied component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { AccessDenied } from '@/components/auth/AccessDenied';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Button
vi.mock('@/components/ui/button/Button', () => ({
    Button: ({ children, onClick, variant }: any) => (
        <button
            data-testid="button"
            data-variant={variant}
            onClick={onClick}
        >
            {children}
        </button>
    ),
}));

// ============================================================================
// TEST SETUP
// ============================================================================

const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter>{children}</MemoryRouter>
    );
};

// ============================================================================
// TESTS
// ============================================================================

describe('AccessDenied - Default Rendering', () => {
    it('should render with default title', () => {
        render(<AccessDenied />, { wrapper: createWrapper() });

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should render with default message', () => {
        render(<AccessDenied />, { wrapper: createWrapper() });

        expect(screen.getByText(/You do not have permission/)).toBeInTheDocument();
    });

    it('should render help text', () => {
        render(<AccessDenied />, { wrapper: createWrapper() });

        expect(screen.getByText(/contact your system administrator/)).toBeInTheDocument();
    });

    it('should render error icon', () => {
        const { container } = render(<AccessDenied />, { wrapper: createWrapper() });

        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('text-red-500');
    });
});

describe('AccessDenied - Custom Message', () => {
    it('should render custom message when provided', () => {
        render(
            <AccessDenied message="Custom error message" />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
        expect(screen.queryByText(/You do not have permission/)).not.toBeInTheDocument();
    });

    it('should render custom message with details', () => {
        render(
            <AccessDenied
                message="Custom error message"
                details="Additional details"
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
        expect(screen.getByText('Additional details')).toBeInTheDocument();
    });
});

describe('AccessDenied - Required Roles', () => {
    it('should display required roles when provided', () => {
        render(
            <AccessDenied requiredRoles={['Administrador', 'Gerente']} />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Required Access:')).toBeInTheDocument();
        expect(screen.getByText('Role: Administrador')).toBeInTheDocument();
        expect(screen.getByText('Role: Gerente')).toBeInTheDocument();
    });

    it('should not display required roles section when not provided', () => {
        render(<AccessDenied />, { wrapper: createWrapper() });

        expect(screen.queryByText('Required Access:')).not.toBeInTheDocument();
    });
});

describe('AccessDenied - Required Permissions', () => {
    it('should display required permissions when provided', () => {
        render(
            <AccessDenied requiredPermissions={['users:read', 'users:write']} />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Required Access:')).toBeInTheDocument();
        expect(screen.getByText('Permission: users:read')).toBeInTheDocument();
        expect(screen.getByText('Permission: users:write')).toBeInTheDocument();
    });

    it('should display both roles and permissions when provided', () => {
        render(
            <AccessDenied
                requiredRoles={['Administrador']}
                requiredPermissions={['users:read']}
            />,
            { wrapper: createWrapper() }
        );

        const requiredAccessSection = screen.getByText('Required Access:');
        expect(requiredAccessSection).toBeInTheDocument();

        expect(screen.getByText('Role: Administrador')).toBeInTheDocument();
        expect(screen.getByText('Permission: users:read')).toBeInTheDocument();
    });
});

describe('AccessDenied - Dashboard Path', () => {
    it('should use default dashboard path', () => {
        render(<AccessDenied />, { wrapper: createWrapper() });

        const returnButton = screen.getByText('Return to Dashboard');
        expect(returnButton).toBeInTheDocument();
    });

    it('should use custom dashboard path when provided', () => {
        render(
            <AccessDenied dashboardPath="/custom-path" />,
            { wrapper: createWrapper() }
        );

        const returnButton = screen.getByText('Return to Dashboard');
        expect(returnButton).toBeInTheDocument();
    });
});

describe('AccessDenied - Navigation', () => {
    it('should navigate back when Go Back is clicked', () => {
        const navigateSpy = vi.fn();
        const { useNavigate } = require('react-router-dom');
        vi.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateSpy);

        render(<AccessDenied />, { wrapper: createWrapper() });

        const goBackButton = screen.getByText('Go Back');
        fireEvent.click(goBackButton);

        expect(navigateSpy).toHaveBeenCalledWith(-1);
    });

    it('should navigate to dashboard when Return to Dashboard is clicked', () => {
        const navigateSpy = vi.fn();
        const { useNavigate } = require('react-router-dom');
        vi.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateSpy);

        render(<AccessDenied />, { wrapper: createWrapper() });

        const returnButton = screen.getByText('Return to Dashboard');
        fireEvent.click(returnButton);

        expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to custom dashboard path when provided', () => {
        const navigateSpy = vi.fn();
        const { useNavigate } = require('react-router-dom');
        vi.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateSpy);

        render(
            <AccessDenied dashboardPath="/custom-path" />,
            { wrapper: createWrapper() }
        );

        const returnButton = screen.getByText('Return to Dashboard');
        fireEvent.click(returnButton);

        expect(navigateSpy).toHaveBeenCalledWith('/custom-path');
    });
});

describe('AccessDenied - Accessibility', () => {
    it('should have alert role', () => {
        render(<AccessDenied />, { wrapper: createWrapper() });

        const container = screen.getByRole('alert');
        expect(container).toBeInTheDocument();
    });

    it('should have aria-live assertive', () => {
        render(<AccessDenied />, { wrapper: createWrapper() });

        const container = screen.getByRole('alert');
        expect(container).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-labelledby', () => {
        render(<AccessDenied />, { wrapper: createWrapper() });

        const container = screen.getByRole('alert');
        expect(container).toHaveAttribute('aria-labelledby', 'access-denied-title');
    });

    it('should have aria-hidden on icon', () => {
        const { container } = render(<AccessDenied />, { wrapper: createWrapper() });

        const icon = container.querySelector('svg');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
});

describe('AccessDenied - Styling', () => {
    it('should have correct container classes', () => {
        const { container } = render(<AccessDenied />, { wrapper: createWrapper() });

        const wrapperDiv = container?.firstElementChild;
        expect(wrapperDiv).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have correct card classes', () => {
        const { container } = render(<AccessDenied />, { wrapper: createWrapper() });

        const card = container?.querySelector('.bg-white');
        expect(card).toHaveClass('rounded-lg', 'shadow-lg', 'p-8', 'text-center');
    });

    it('should have correct error icon classes', () => {
        const { container } = render(<AccessDenied />, { wrapper: createWrapper() });

        const iconContainer = container?.querySelector('.mx-auto');
        expect(iconContainer).toHaveClass('mx-auto', 'mb-6');
    });
});
