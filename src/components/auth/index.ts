/**
 * Auth Components Index
 * Exports all auth-related components
 */

// Auth Error Handler Components
export {
    AuthErrorDisplay,
    SessionExpiryWarning,
    NetworkErrorDisplay,
    AuthLoadingSpinner,
    AuthErrorWrapper,
} from './AuthErrorHandler';

export type {
    AuthErrorDisplayProps,
    SessionExpiryWarningProps,
    NetworkErrorDisplayProps,
    AuthLoadingSpinnerProps,
    AuthErrorWrapperProps,
} from './AuthErrorHandler';

// ProtectedRoute Component
export { ProtectedRoute } from './ProtectedRoute';
export type {
    ProtectedRouteProps,
    UserRole,
    Permission,
} from './ProtectedRoute';

// AccessDenied Component
export { AccessDenied } from './AccessDenied';
export type {
    AccessDeniedProps,
} from './AccessDenied';

export { default } from './AuthErrorHandler';
