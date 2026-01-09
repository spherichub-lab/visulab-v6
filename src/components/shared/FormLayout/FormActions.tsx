/**
 * FormActions - Actions component for FormLayout
 * Provides consistent action buttons layout
 */

import React from 'react';
import { cn } from '../../../utils';
import { FormActionsProps } from './types';

/**
 * Actions component for FormLayout
 */
export const FormActions: React.FC<FormActionsProps> = ({
    align = 'right',
    children,
    loading = false,
    disabled = false,
    className,
}) => {
    const containerClasses = cn(
        'flex gap-3 pt-4',
        {
            'justify-start': align === 'left',
            'justify-center': align === 'center',
            'justify-end': align === 'right',
        },
        className
    );

    return (
        <div className={containerClasses}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    const isSubmitButton = child.props.type === 'submit';
                    return React.cloneElement(child, {
                        disabled: disabled || child.props.disabled,
                        loading: loading || child.props.loading,
                        'data-testid': isSubmitButton ? 'btn-submit' : child.props['data-testid'],
                    });
                }
                return child;
            })}
        </div>
    );
};

FormActions.displayName = 'FormActions';

export default FormActions;