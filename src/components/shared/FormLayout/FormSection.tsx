/**
 * FormSection - Section component for FormLayout
 * Provides organized sections with optional collapsibility
 */

import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { Button } from '../../ui';
import { cn } from '../../../utils';
import { FormSectionProps } from './types';

/**
 * Section component for FormLayout
 */
export const FormSection: React.FC<FormSectionProps> = ({
    title,
    description,
    collapsible = false,
    defaultCollapsed = false,
    bordered = false,
    children,
    className,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const containerClasses = cn(
        'space-y-4',
        bordered && 'p-4 border border-slate-200 dark:border-slate-600 rounded-lg',
        className
    );

    const headerClasses = cn(
        'flex items-center justify-between',
        title && 'mb-4'
    );

    const titleClasses = cn(
        'text-lg font-semibold text-slate-900 dark:text-white',
        !title && 'text-base font-medium'
    );

    const handleToggle = () => {
        if (collapsible) {
            setIsCollapsed(!isCollapsed);
        }
    };

    return (
        <div className={containerClasses}>
            {(title || collapsible) && (
                <div className={headerClasses}>
                    {title && (
                        <h3 className={titleClasses}>
                            {title}
                        </h3>
                    )}

                    {collapsible && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggle}
                            className="p-1.5"
                            aria-label={isCollapsed ? 'Expandir seção' : 'Recolher seção'}
                            aria-expanded={!isCollapsed}
                        >
                            <Icon
                                name={isCollapsed ? 'expand_more' : 'expand_less'}
                                className="!text-lg"
                            />
                        </Button>
                    )}
                </div>
            )}

            {description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {description}
                </p>
            )}

            {!isCollapsed && (
                <div className="space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
};

FormSection.displayName = 'FormSection';

export default FormSection;