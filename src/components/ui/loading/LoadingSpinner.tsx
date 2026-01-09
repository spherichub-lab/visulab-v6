/**
 * LoadingSpinner - Reusable loading spinner component
 * Built with design tokens and accessibility in mind
 */

import React from 'react';
import { cn } from '../../../utils';

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'secondary' | 'white' | 'current';
    message?: string;
    overlay?: boolean;
    className?: string;
}

// Size configurations
const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
};

// Color configurations
const colorClasses = {
    primary: 'border-primary-500 border-t-transparent',
    secondary: 'border-slate-300 border-t-transparent dark:border-slate-600 dark:border-t-transparent',
    white: 'border-white border-t-transparent',
    current: 'border-current border-t-transparent',
};

/**
 * Reusable LoadingSpinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = 'primary',
    message,
    overlay = false,
    className,
}) => {
    const spinnerClasses = cn(
        'animate-spin border-2 border-solid rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
    );

    const content = (
        <>
            <div className={spinnerClasses} role="status" aria-label="Carregando">
                <span className="sr-only">Carregando</span>
            </div>

            {message && (
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    {message}
                </span>
            )}
        </>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex items-center">
                    {content}
                </div>
            </div>
        );
    }

    return <div className="flex items-center">{content}</div>;
};

export default LoadingSpinner;