/**
 * PageHeader - Main page header component
 * Provides consistent page structure with navigation, search, and actions
 */

import React from 'react';
import { Button } from '../../ui';
import { cn } from '../../../utils';
import { PageHeaderProps } from './types';
import { PageHeaderBreadcrumb } from './PageHeaderBreadcrumb';
import { PageHeaderSearch } from './PageHeaderSearch';
import { PageHeaderActions, renderActions } from './PageHeaderActions';

/**
 * Main PageHeader component
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    description,
    breadcrumb,
    actions,
    primaryAction,
    search,
    filters,
    size = 'md',
    sticky = false,
    bordered = false,
    left,
    right,
    center,
    collapsibleOnMobile = true,
    showBreadcrumbOnMobile = true,
    className,
    testId,
}) => {
    // Generate action testId based on action key
    const getActionTestId = (action: any) => {
        if (action.key === 'create') {
            // Check if it's for empresas or faltas based on label
            return action.label.includes('Empresa') ? 'btn-create-empresa' : 'btn-create-falta';
        }
        return `btn-${action.key}`;
    };
    // Size configurations
    const sizeClasses = {
        sm: 'py-3 px-4',
        md: 'py-4 px-6',
        lg: 'py-6 px-8',
    };

    // Container classes
    const containerClasses = cn(
        'w-full bg-white dark:bg-surface-dark',
        sizeClasses[size],
        {
            'sticky top-0 z-40 shadow-sm': sticky,
            'border-b border-slate-200 dark:border-slate-700': bordered,
        },
        className
    );

    // Content layout
    const contentClasses = cn(
        'max-w-7xl mx-auto',
        {
            'flex flex-col space-y-4': true,
            'lg:flex-row lg:items-center lg:justify-between lg:space-y-0': true,
        }
    );

    // Title section classes
    const titleSectionClasses = cn(
        'flex-1',
        {
            'hidden lg:block': collapsibleOnMobile,
            'mb-4 lg:mb-0': collapsibleOnMobile,
        }
    );

    // Actions section classes
    const actionsSectionClasses = cn(
        'flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-3',
        {
            'w-full lg:w-auto': true,
            'lg:flex-1': !search && !filters,
        }
    );

    const renderTitleSection = () => (
        <div className={titleSectionClasses}>
            {breadcrumb && (
                <PageHeaderBreadcrumb
                    items={breadcrumb}
                    className={cn(
                        'mb-2',
                        {
                            'hidden md:block': !showBreadcrumbOnMobile,
                        }
                    )}
                />
            )}

            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {title}
                </h1>

                {subtitle && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {subtitle}
                    </p>
                )}

                {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );

    const renderActionsSection = () => (
        <div className={actionsSectionClasses}>
            {/* Custom left content */}
            {left && (
                <div className="flex items-center gap-3">
                    {left}
                </div>
            )}

            {/* Search */}
            {search && (
                <div className="flex-1 lg:max-w-md">
                    <PageHeaderSearch {...search} />
                </div>
            )}

            {/* Filters */}
            {filters && (
                <div className="flex items-center gap-2">
                    {filters}
                </div>
            )}

            {/* Custom center content */}
            {center && (
                <div className="flex items-center gap-3">
                    {center}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                {Array.isArray(actions) ? (
                    <PageHeaderActions>
                        {renderActions(actions)}
                    </PageHeaderActions>
                ) : (
                    actions
                )}

                {primaryAction && (
                    <div className="flex items-center">
                        {primaryAction}
                    </div>
                )}
            </div>

            {/* Custom right content */}
            {right && (
                <div className="flex items-center gap-3">
                    {right}
                </div>
            )}
        </div>
    );

    return (
        <header
            className={containerClasses}
            role="banner"
            data-testid={testId}
        >
            <div className={contentClasses}>
                {renderTitleSection()}
                {renderActionsSection()}
            </div>
        </header>
    );
};

PageHeader.displayName = 'PageHeader';

// Attach subcomponents as static properties
PageHeader.Breadcrumb = PageHeaderBreadcrumb;
PageHeader.Search = PageHeaderSearch;
PageHeader.Actions = PageHeaderActions;

export default PageHeader;