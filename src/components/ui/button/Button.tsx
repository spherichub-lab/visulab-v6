/**
 * Button - Reusable button component with multiple variants and states
 * Built with design tokens and accessibility in mind
 */

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { Icon } from '../../../../components/Icon';
import { cn } from '../../../utils';

// Button variants configuration
const buttonVariants = {
    variant: {
        primary: 'bg-slate-900 dark:bg-primary text-white border-slate-900 dark:border-primary hover:bg-slate-800 hover:border-slate-800 active:bg-slate-700 active:border-slate-700 focus:ring-2 focus:ring-slate-200 focus:border-slate-500 disabled:bg-slate-300 disabled:border-slate-300 disabled:text-slate-100 shadow-md hover:shadow-lg',
        secondary: 'bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 focus:ring-2 focus:ring-slate-200 focus:border-slate-500 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:border-slate-200 dark:disabled:border-slate-600 disabled:text-slate-400 dark:disabled:text-slate-500 shadow-sm hover:shadow-md',
        danger: 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600 active:bg-red-700 active:border-red-700 focus:ring-2 focus:ring-red-200 focus:border-red-500 disabled:bg-red-300 disabled:border-red-300 disabled:text-red-100 shadow-md hover:shadow-lg',
        warning: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:border-amber-600 active:bg-amber-700 active:border-amber-700 focus:ring-2 focus:ring-amber-200 focus:border-amber-500 disabled:bg-amber-300 disabled:border-amber-300 disabled:text-amber-100 shadow-md hover:shadow-lg',
        ghost: 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 active:bg-slate-200 dark:active:bg-slate-700 focus:ring-2 focus:ring-slate-200 focus:border-slate-500 disabled:text-slate-400 dark:disabled:text-slate-500 hover:shadow-sm',
        outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-500 dark:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-600 dark:hover:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:border-slate-500 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:border-slate-300 dark:disabled:border-slate-600 disabled:bg-transparent',
    },
    size: {
        sm: 'px-3 py-1.5 text-xs font-medium rounded-md gap-1.5',
        md: 'px-4 py-2 text-sm font-semibold rounded-lg gap-2',
        lg: 'px-6 py-3 text-base font-bold rounded-xl gap-2.5',
    },
};

// Loading spinner component
const LoadingSpinner = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <div
            className={cn(
                'animate-spin border-2 border-current border-t-transparent rounded-full',
                sizeClasses[size]
            )}
        />
    );
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    variant?: keyof typeof buttonVariants.variant;
    size?: keyof typeof buttonVariants.size;
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    type?: 'button' | 'submit' | 'reset';
    children: React.ReactNode;
    className?: string;
    loadingText?: string;
    onClick?: () => void | Promise<void>;
}

/**
 * Reusable Button component with multiple variants and states
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            disabled = false,
            icon,
            iconPosition = 'left',
            fullWidth = false,
            type = 'button',
            children,
            className,
            loadingText,
            onClick,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-offset-2 border-2 relative overflow-hidden disabled:cursor-not-allowed transform active:scale-95';

        const variantClasses = buttonVariants.variant[variant];
        const sizeClasses = buttonVariants.size[size];
        const widthClasses = fullWidth ? 'w-full' : 'w-auto';

        const classes = cn(
            baseClasses,
            variantClasses,
            sizeClasses,
            widthClasses,
            className
        );

        const renderIcon = (iconName: string, position: 'left' | 'right') => (
            <Icon
                name={iconName}
                className={cn(
                    'flex-shrink-0',
                    position === 'left' ? '-ml-1' : '-mr-1'
                )}
            />
        );

        const renderContent = () => {
            if (loading) {
                return (
                    <>
                        <LoadingSpinner size={size as 'sm' | 'md' | 'lg'} />
                        <span>{loadingText || 'Carregando...'}</span>
                    </>
                );
            }

            const hasIcon = icon && !loading;
            const iconOnLeft = hasIcon && iconPosition === 'left';
            const iconOnRight = hasIcon && iconPosition === 'right';

            return (
                <>
                    {iconOnLeft && renderIcon(icon, 'left')}
                    <span className="truncate">{children}</span>
                    {iconOnRight && renderIcon(icon, 'right')}
                </>
            );
        };

        return (
            <button
                ref={ref}
                type={type}
                className={classes}
                disabled={isDisabled}
                onClick={onClick}
                aria-disabled={isDisabled}
                aria-describedby={loading ? 'loading-description' : undefined}
                {...props}
            >
                {renderContent()}

                {/* Screen reader announcement for loading state */}
                {loading && (
                    <span id="loading-description" className="sr-only">
                        Carregando, aguarde
                    </span>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;