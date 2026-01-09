/**
 * PageHeaderActions - Actions container component for PageHeader
 * Provides consistent action buttons layout
 */

import React from 'react';
import { Icon } from '../../../../components/Icon';
import { Button } from '../../ui';
import { cn } from '../../../utils';
import { PageHeaderActionsProps, PageHeaderAction } from './types';

/**
 * Actions container component
 */
export const PageHeaderActions: React.FC<PageHeaderActionsProps> = ({
    children,
    align = 'right',
    className,
}) => {
    const containerClasses = cn(
        'flex items-center gap-3',
        {
            'justify-start': align === 'left',
            'justify-center': align === 'center',
            'justify-end': align === 'right',
        },
        className
    );

    return (
        <div className={containerClasses}>
            {children}
        </div>
    );
};

PageHeaderActions.displayName = 'PageHeaderActions';

/**
 * Render action buttons from configuration
 */
export const renderActions = (actions?: PageHeaderAction[]) => {
    if (!actions || actions.length === 0) {
        return null;
    }

    return actions.map((action) => {
        // Generate data-testid based on action key
        const getTestId = (action: PageHeaderAction) => {
            if (action.key === 'create') {
                return action.label.includes('Empresa') ? 'btn-create-empresa' : 'btn-create-falta';
            }
            return undefined;
        };

        const buttonProps = {
            key: action.key,
            variant: action.variant || 'secondary',
            size: action.size || 'md',
            loading: action.loading,
            disabled: action.disabled,
            onClick: action.onClick,
            'data-testid': getTestId(action),
            children: (
                <>
                    {action.icon && (
                        <Icon name={action.icon} className="!text-sm mr-1" />
                    )}
                    {action.label}
                </>
            ),
        };

        if (action.href) {
            return (
                <Button
                    {...buttonProps}
                    as="a"
                    href={action.href}
                />
            );
        }

        return <Button {...buttonProps} />;
    });
};

PageHeaderActions.displayName = 'PageHeaderActions';

export default PageHeaderActions;