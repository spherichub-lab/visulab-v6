/**
 * FormField - Field wrapper component for FormLayout
 * Provides consistent structure for form fields with labels, errors, and help text
 */

import React from 'react';
import { Icon } from '../../../../components/Icon';
import { cn } from '../../../utils';
import { FormFieldProps } from './types';

/**
 * Field wrapper component for FormLayout
 */
export const FormField: React.FC<FormFieldProps> = ({
    name,
    label,
    description,
    required = false,
    error,
    disabled = false,
    children,
    className,
}) => {
    const fieldId = `field-${name}`;
    const errorId = error ? `${fieldId}-error` : undefined;
    const descriptionId = description ? `${fieldId}-description` : undefined;

    const containerClasses = cn(
        'space-y-1.5',
        className
    );

    const labelClasses = cn(
        'block text-sm font-medium text-slate-700 dark:text-slate-300',
        required && 'after:content[" *"] after:text-red-500 after:ml-0.5'
    );

    const errorClasses = 'text-xs text-red-600 dark:text-red-400 flex items-center gap-1';
    const descriptionClasses = 'text-xs text-slate-500 dark:text-slate-400';

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

            <div className="relative">
                {React.isValidElement(children) && React.cloneElement(children as React.ReactElement, {
                    id: fieldId,
                    'aria-invalid': !!error,
                    'aria-describedby': cn(errorId, descriptionId),
                    'aria-required': required,
                    disabled,
                })}
            </div>

            {description && !error && (
                <div id={descriptionId} className={descriptionClasses}>
                    {description}
                </div>
            )}

            {error && (
                <div id={errorId} className={errorClasses} role="alert" data-testid="validation-error">
                    <Icon name="error_outline" className="!text-sm" />
                    {error}
                </div>
            )}
        </div>
    );
};

FormField.displayName = 'FormField';

export default FormField;