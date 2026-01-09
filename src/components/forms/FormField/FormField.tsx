/**
 * FormField - Reusable form field wrapper component
 * Provides consistent label, error, and helper text layout
 */

import React, { ReactNode } from 'react';
import { cn } from '../../../utils';
import { Input, type InputProps } from '../../ui/input';

export interface FormFieldProps {
    label: string;
    error?: string;
    helper?: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
    htmlFor?: string;
}

/**
 * Reusable FormField component for consistent form layouts
 */
export const FormField: React.FC<FormFieldProps> = ({
    label,
    error,
    helper,
    required = false,
    children,
    className,
    htmlFor,
}) => {
    const fieldId = htmlFor || `field-${Math.random().toString(36).substr(2, 9)}`;

    const containerClasses = cn(
        'space-y-1.5',
        className
    );

    const labelClasses = cn(
        'block text-xs font-semibold text-slate-500 dark:text-slate-400',
        required && 'after:content[" *"] after:text-red-500 after:ml-1'
    );

    const errorClasses = 'text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1';
    const helperClasses = 'text-xs text-slate-500 dark:text-slate-400 mt-1';

    return (
        <div className={containerClasses}>
            {label && (
                <label
                    htmlFor={fieldId}
                    className={labelClasses}
                >
                    {label}
                </label>
            )}

            {/* Clone children with additional props if it's an Input */}
            {React.isValidElement(children) && children.type === Input
                ? React.cloneElement(children as React.ReactElement<InputProps>, {
                    id: fieldId,
                    error: error || children.props.error,
                    'aria-describedby': cn(
                        error && `${fieldId}-error`,
                        helper && `${fieldId}-helper`
                    ),
                    'aria-invalid': !!error,
                })
                : React.cloneElement(children, {
                    id: fieldId,
                    'aria-describedby': cn(
                        error && `${fieldId}-error`,
                        helper && `${fieldId}-helper`
                    ),
                    'aria-invalid': !!error,
                })
            }

            {error && (
                <div id={`${fieldId}-error`} className={errorClasses} role="alert">
                    {error}
                </div>
            )}

            {helper && !error && (
                <div id={`${fieldId}-helper`} className={helperClasses}>
                    {helper}
                </div>
            )}
        </div>
    );
};

export default FormField;