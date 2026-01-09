/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and optionally role-based access control
 * 
 * SECURITY IMPROVEMENTS:
 * - Server-side session validation before allowing access
 * - Shows loading state during validation
 * - Redirects to login if session is invalid or expired
 * - Role-based access control (RBAC) support
 * - Permission-based access control support
 * - Custom fallback paths for unauthorized access
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { LoadingSpinner } from '../../components/ui/loading/LoadingSpinner';
import { AccessDenied } from './AccessDenied';

// Debug flag - set to false to disable auth debug logging in production
const DEBUG_AUTH = import.meta.env.DEV;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Role type based on existing AuthUser type
 */
export type UserRole = 'Administrador' | 'Usuário';

/**
 * Permission type for fine-grained access control
 */
export type Permission = string;

/**
 * Props for ProtectedRoute component
 */
export interface ProtectedRouteProps {
    /**
     * Child components to render if authorized
     */
    children: React.ReactNode;

    /**
     * Array of roles that are allowed to access this route
     * If provided, user must have at least one of these roles
     * Optional - if not provided, only authentication is checked
     */
    requiredRoles?: UserRole[];

    /**
     * Array of permissions that are required to access this route
     * If provided, user must have all of these permissions
     * Optional - if not provided, only authentication is checked
     */
    requiredPermissions?: Permission[];

    /**
     * Custom path to redirect to when user lacks required roles/permissions
     * Defaults to '/dashboard' if not provided
     */
    fallbackPath?: string;

    /**
     * Custom message to display in AccessDenied component
     */
    accessDeniedMessage?: string;

    /**
     * Additional details to display in AccessDenied component
     */
    accessDeniedDetails?: string;

    /**
     * Timeout in milliseconds for role/permission checking
     * Defaults to 5000ms (5 seconds)
     */
    checkTimeout?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CHECK_TIMEOUT = 5000; // 5 seconds
const DEFAULT_FALLBACK_PATH = '/dashboard';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ProtectedRoute Component
 * 
 * Validates session with Supabase and optionally checks user roles/permissions
 * before allowing access to protected routes.
 * 
 * @example
 * ```tsx
 * // Basic authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // Role-based protection
 * <ProtectedRoute requiredRoles={['Administrador']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * // Multiple roles (user needs at least one)
 * <ProtectedRoute requiredRoles={['Administrador', 'Gerente']}>
 *   <ManagementPanel />
 * </ProtectedRoute>
 * 
 * // Permission-based protection
 * <ProtectedRoute requiredPermissions={['users:read', 'users:write']}>
 *   <UserManagement />
 * </ProtectedRoute>
 * 
 * // With custom fallback path
 * <ProtectedRoute 
 *   requiredRoles={['Administrador']}
 *   fallbackPath="/unauthorized"
 * >
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRoles,
    requiredPermissions,
    fallbackPath = DEFAULT_FALLBACK_PATH,
    accessDeniedMessage,
    accessDeniedDetails,
    checkTimeout = DEFAULT_CHECK_TIMEOUT,
}) => {
    const { isAuthenticated, isLoading, isInitialized, validateSession, logout, hasRole, hasPermission } = useAuth();
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isCheckingAccess, setIsCheckingAccess] = useState(false);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    // Ref to track if validation has been done
    const hasValidatedRef = useRef(false);

    /**
     * Check if user has required roles
     * Returns true if:
     * - No roles are required (requiredRoles is undefined or empty)
     * - User has at least one of the required roles
     */
    const checkRoles = useCallback((): boolean => {
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // User must have at least one of the required roles
        return requiredRoles.some(role => hasRole(role));
    }, [requiredRoles, hasRole]);

    /**
     * Check if user has required permissions
     * Returns true if:
     * - No permissions are required (requiredPermissions is undefined or empty)
     * - User has all of the required permissions
     */
    const checkPermissions = useCallback((): boolean => {
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        // User must have all required permissions
        return requiredPermissions.every(permission => hasPermission(permission));
    }, [requiredPermissions, hasPermission]);

    /**
     * Check if user has access based on roles and permissions
     */
    const checkAccess = useCallback((): boolean => {
        const hasRequiredRoles = checkRoles();
        const hasRequiredPermissions = checkPermissions();

        return hasRequiredRoles && hasRequiredPermissions;
    }, [checkRoles, checkPermissions]);

    /**
     * Validate session on mount
     * SECURITY: Ensures session is still valid on the server side
     * FIX: Prevent logout during auth initialization or loading states
     * FIX: Only validate ONCE to prevent infinite re-validation
     */
    useEffect(() => {
        if (DEBUG_AUTH) {
            console.log('🔍 [PROTECTED ROUTE DEBUG] Validation effect RUNNING');
        }

        const validate = async () => {
            if (DEBUG_AUTH) console.log('🔍 [PROTECTED ROUTE DEBUG] Session validation triggered', {
                isInitialized,
                isAuthenticated,
                isLoading,
                hasValidated: hasValidatedRef.current
            });

            // FIX: Skip validation if still loading or not initialized
            // This prevents race condition during login flow
            if (isLoading || !isInitialized) {
                if (DEBUG_AUTH) console.log('🔍 [PROTECTED ROUTE DEBUG] Skipping validation - still loading or not initialized');
                return;
            }

            // FIX: Skip if already validated to prevent infinite re-validation
            if (hasValidatedRef.current) {
                if (DEBUG_AUTH) console.log('🔍 [PROTECTED ROUTE DEBUG] Skipping validation - already validated');
                return;
            }

            // Only validate if we're initialized and authenticated
            if (isAuthenticated) {
                if (DEBUG_AUTH) console.log('🔍 [PROTECTED ROUTE DEBUG] Starting session validation');
                setIsValidating(true);
                try {
                    const sessionValid = await validateSession();
                    if (DEBUG_AUTH) console.log('🔍 [PROTECTED ROUTE DEBUG] Session validation result:', sessionValid);
                    setIsValid(sessionValid);

                    // Mark as validated
                    hasValidatedRef.current = true;

                    // If session is invalid, logout
                    if (!sessionValid) {
                        if (DEBUG_AUTH) console.log('🔍 [PROTECTED ROUTE DEBUG] Session invalid, calling logout');
                        await logout();
                    }
                } catch (error) {
                    console.error('🔍 [PROTECTED ROUTE DEBUG] Session validation error:', error);
                    setIsValid(false);
                    hasValidatedRef.current = true;
                    await logout();
                } finally {
                    setIsValidating(false);
                }
            } else {
                // Not authenticated, set isValid to false
                if (DEBUG_AUTH) console.log('🔍 [PROTECTED ROUTE DEBUG] Not authenticated, setting isValid to false');
                setIsValid(false);
                hasValidatedRef.current = true;
            }
        };

        validate();
    }, [isInitialized, isAuthenticated, isLoading]); // Removed validateSession and logout from dependencies

    /**
     * Check user access (roles/permissions) after authentication is confirmed
     */
    useEffect(() => {
        if (isValid === true && isAuthenticated && !isValidating) {
            setIsCheckingAccess(true);

            // Set a timeout to prevent indefinite loading
            const timeoutId = setTimeout(() => {
                console.warn('Role/permission check timeout');
                setIsCheckingAccess(false);
                setHasAccess(false);
            }, checkTimeout);

            try {
                // Check if user has required access
                const accessGranted = checkAccess();
                setHasAccess(accessGranted);
            } catch (error) {
                console.error('Access check error:', error);
                setHasAccess(false);
            } finally {
                clearTimeout(timeoutId);
                setIsCheckingAccess(false);
            }
        }
    }, [isValid, isAuthenticated, isValidating, requiredRoles, requiredPermissions, checkTimeout]);

    // Show loading state while initializing auth
    if (isLoading || isValidating) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Show loading state while validating session
    if (isValid === null && isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Show loading state while checking roles/permissions
    if (isCheckingAccess) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Redirect to login if not authenticated or session is invalid
    if (!isAuthenticated || isValid === false) {
        return <Navigate to="/" replace />;
    }

    // Show AccessDenied if user lacks required roles/permissions
    if (hasAccess === false) {
        return (
            <AccessDenied
                requiredRoles={requiredRoles}
                requiredPermissions={requiredPermissions}
                message={accessDeniedMessage}
                dashboardPath={fallbackPath}
                details={accessDeniedDetails}
            />
        );
    }

    // Render children if authenticated, session is valid, and user has access
    return <>{children}</>;
};

export default ProtectedRoute;
