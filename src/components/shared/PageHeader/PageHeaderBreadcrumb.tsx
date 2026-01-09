/**
 * PageHeaderBreadcrumb - Breadcrumb navigation component for PageHeader
 * Provides navigation hierarchy with accessibility
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../../components/Icon';
import { cn } from '../../../utils';
import { PageHeaderBreadcrumbProps } from './types';

/**
 * Breadcrumb navigation component
 */
export const PageHeaderBreadcrumb: React.FC<PageHeaderBreadcrumbProps> = ({
    items,
    className,
}) => {
    const containerClasses = cn(
        'flex items-center space-x-2 text-sm',
        className
    );

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <nav className={containerClasses} aria-label="Navegação estrutural">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <Icon name="chevron_right" className="!text-sm text-slate-400" />
                    )}

                    {item.href ? (
                        <Link
                            to={item.href}
                            className={cn(
                                'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors',
                                item.active && 'text-slate-900 dark:text-white font-medium'
                            )}
                            aria-current={item.active ? 'page' : undefined}
                        >
                            {item.icon && (
                                <Icon name={item.icon} className="!text-sm mr-1" />
                            )}
                            {item.label}
                        </Link>
                    ) : (
                        <span className={cn(
                            'text-slate-500 dark:text-slate-400',
                            item.active && 'text-slate-900 dark:text-white font-medium'
                        )}>
                            {item.icon && (
                                <Icon name={item.icon} className="!text-sm mr-1" />
                            )}
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

PageHeaderBreadcrumb.displayName = 'PageHeaderBreadcrumb';

export default PageHeaderBreadcrumb;