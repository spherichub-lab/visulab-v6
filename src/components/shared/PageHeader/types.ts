/**
 * PageHeader component TypeScript interfaces
 * Defines public API and contracts for PageHeader functionality
 */

import React from 'react';

/**
 * Base component props for shared components
 */
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
    testId?: string;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
    /** Item label */
    label: string;
    /** Item link */
    href?: string;
    /** Whether item is active */
    active?: boolean;
    /** Custom icon */
    icon?: string;
}

/**
 * Search configuration
 */
export interface PageHeaderSearch {
    /** Search placeholder */
    placeholder?: string;
    /** Current search value */
    value?: string;
    /** Callback when search changes */
    onChange?: (value: string) => void;
    /** Callback when search is cleared */
    onClear?: () => void;
    /** Debounce delay in ms */
    debounce?: number;
    /** Whether to show clear button */
    showClear?: boolean;
}

/**
 * Page header action
 */
export interface PageHeaderAction {
    /** Action key */
    key: string;
    /** Action label */
    label: string;
    /** Action icon */
    icon?: string;
    /** Action variant */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    /** Action size */
    size?: 'sm' | 'md' | 'lg';
    /** Whether action is loading */
    loading?: boolean;
    /** Whether action is disabled */
    disabled?: boolean;
    /** Action callback */
    onClick?: () => void;
    /** Action href */
    href?: string;
}

/**
 * Main PageHeader props
 */
export interface PageHeaderProps extends BaseComponentProps {
    /** Page title */
    title: string;
    /** Page subtitle */
    subtitle?: string;
    /** Page description */
    description?: string;

    /** Navigation */
    breadcrumb?: BreadcrumbItem[];

    /** Actions */
    actions?: React.ReactNode | PageHeaderAction[];
    primaryAction?: React.ReactNode;

    /** Search */
    search?: PageHeaderSearch;

    /** Filters */
    filters?: React.ReactNode;

    /** Layout */
    size?: 'sm' | 'md' | 'lg';
    sticky?: boolean;
    bordered?: boolean;

    /** Custom sections */
    left?: React.ReactNode;
    right?: React.ReactNode;
    center?: React.ReactNode;

    /** Responsive behavior */
    collapsibleOnMobile?: boolean;
    showBreadcrumbOnMobile?: boolean;
}

/**
 * PageHeader breadcrumb props
 */
export interface PageHeaderBreadcrumbProps {
    /** Breadcrumb items */
    items: BreadcrumbItem[];
    /** Custom class name */
    className?: string;
}

/**
 * PageHeader actions props
 */
export interface PageHeaderActionsProps {
    /** Action content */
    children: React.ReactNode;
    /** Action alignment */
    align?: 'left' | 'center' | 'right';
    /** Custom class name */
    className?: string;
}

/**
 * PageHeader search props
 */
export interface PageHeaderSearchProps extends PageHeaderSearch {
    /** Custom class name */
    className?: string;
}