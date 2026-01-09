/**
 * AccessDenied Component
 * Displays when user is authenticated but lacks required roles/permissions
 * 
 * FEATURES:
 * - User-friendly error message
 * - Information about required roles/permissions
 * - Navigation options to return to dashboard or go back
 * - Accessible error handling
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button/Button';

// ============================================================================
// TYPES
// ============================================================================

export interface AccessDeniedProps {
    /**
     * Required roles that the user lacks
     */
    requiredRoles?: string[];

    /**
     * Required permissions that the user lacks
     */
    requiredPermissions?: string[];

    /**
     * Custom message to display
     */
    message?: string;

    /**
     * Path to redirect when clicking "Return to Dashboard"
     * Defaults to '/dashboard'
     */
    dashboardPath?: string;

    /**
     * Additional details to display
     */
    details?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AccessDenied Component
 * 
 * Displays a user-friendly error page when a user is authenticated
 * but lacks the required roles or permissions to access a resource.
 * 
 * @example
 * ```tsx
 * <AccessDenied 
 *   requiredRoles={['Administrador']}
 *   message="You need admin privileges to access this page"
 * />
 * ```
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({
    requiredRoles = [],
    requiredPermissions = [],
    message,
    dashboardPath = '/dashboard',
    details,
}) => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleReturnToDashboard = () => {
        navigate(dashboardPath);
    };

    // Build the list of missing requirements
    const missingRequirements: string[] = [];

    if (requiredRoles.length > 0) {
        missingRequirements.push(...requiredRoles.map(role => `Role: ${role}`));
    }

    if (requiredPermissions.length > 0) {
        missingRequirements.push(...requiredPermissions.map(perm => `Permission: ${perm}`));
    }

    // Default message if none provided
    const defaultMessage = message || 'You do not have permission to access this resource.';

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4"
            role="alert"
            aria-live="assertive"
            aria-labelledby="access-denied-title"
        >
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
                {/* Error Icon */}
                <div className="mx-auto mb-6">
                    <svg
                        className="w-20 h-20 mx-auto text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Error Title */}
                <h1
                    id="access-denied-title"
                    className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4"
                >
                    Access Denied
                </h1>

                {/* Error Message */}
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
                    {defaultMessage}
                </p>

                {/* Additional Details */}
                {details && (
                    <p className="text-slate-500 dark:text-slate-500 mb-6 text-sm">
                        {details}
                    </p>
                )}

                {/* Missing Requirements */}
                {missingRequirements.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6 text-left">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Required Access:
                        </h2>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {missingRequirements.map((req, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="mr-2 text-red-500" aria-hidden="true">•</span>
                                    <span>{req}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Help Text */}
                <p className="text-slate-500 dark:text-slate-500 mb-6 text-sm">
                    If you believe this is an error, please contact your system administrator.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={handleGoBack}
                        variant="outline"
                        className="w-full sm:w-auto"
                    >
                        Go Back
                    </Button>
                    <Button
                        onClick={handleReturnToDashboard}
                        variant="primary"
                        className="w-full sm:w-auto"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
