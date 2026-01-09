/**
 * Input - Reusable input component with validation and accessibility
 * Built with design tokens and accessibility in mind
 */

import React, { forwardRef, InputHTMLAttributes, ChangeEvent, FocusEvent } from 'react';
import { Icon } from '../../../../components/Icon';
import { cn } from '../../../utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helper?: string;
    required?: boolean;
    disabled?: boolean;
    icon?: string;
    size?: 'sm' | 'md' | 'lg';
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
    className?: string;
    containerClassName?: string;
}

// Size configurations
const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-5 py-3 text-lg rounded-xl',
};

// Icon size configurations
const iconSizeClasses = {
    sm: '!text-sm',
    md: '!text-base',
    lg: '!text-lg',
};

/**
 * Reusable Input component with validation and accessibility
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helper,
            required = false,
            disabled = false,
            icon,
            size = 'md',
            value,
            onChange,
            onBlur,
            onFocus,
            className,
            containerClassName,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const errorId = error ? `${inputId}-error` : undefined;
        const helperId = helper ? `${inputId}-helper` : undefined;

        const baseClasses = `
      w-full border-2 transition-all duration-200
      bg-white dark:bg-surface-dark
      text-slate-900 dark:text-white
      placeholder-slate-400 dark:placeholder-slate-500
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-60 disabled:cursor-not-allowed
    `;

        const stateClasses = error
            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:ring-red-200 focus:border-red-500'
            : 'border-slate-200 dark:border-slate-600 focus:ring-slate-200 focus:border-slate-500';

        const sizeClass = sizeClasses[size];
        const iconPadding = icon ? (size === 'sm' ? 'pl-9' : size === 'md' ? 'pl-10' : 'pl-12') : '';
        const iconSize = iconSizeClasses[size];

        const inputClasses = cn(
            baseClasses,
            stateClasses,
            sizeClass,
            iconPadding,
            className
        );

        const containerClasses = cn(
            'relative',
            containerClassName
        );

        const labelClasses = cn(
            'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1',
            required && 'after:content[" *"] after:text-red-500'
        );

        const errorClasses = 'mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 ml-1';
        const helperClasses = 'mt-1 text-xs text-slate-500 dark:text-slate-400 ml-1';

        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            if (onChange) {
                onChange(e.target.value);
            }
        };

        const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
            if (onBlur) {
                onBlur(e);
            }
        };

        const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
            if (onFocus) {
                onFocus(e);
            }
        };

        return (
            <div className={containerClasses}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className={labelClasses}
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                            <Icon name={icon} className={iconSize} />
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={handleFocus}
                        disabled={disabled}
                        className={inputClasses}
                        aria-invalid={!!error}
                        aria-describedby={cn(errorId, helperId)}
                        aria-required={required}
                        {...props}
                    />
                </div>

                {error && (
                    <div id={errorId} className={errorClasses} role="alert">
                        <Icon name="error_outline" className="!text-sm" />
                        {error}
                    </div>
                )}

                {helper && !error && (
                    <div id={helperId} className={helperClasses}>
                        {helper}
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;