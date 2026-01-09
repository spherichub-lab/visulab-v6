/**
 * FormLayout component TypeScript interfaces
 * Defines the public API and contracts for FormLayout functionality
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
 * Form layout options
 */
export type FormLayoutType = 'vertical' | 'horizontal' | 'grid';

/**
 * Form spacing options
 */
export type FormSpacing = 'compact' | 'normal' | 'loose';

/**
 * Form field props
 */
export interface FormFieldProps extends BaseComponentProps {
    /** Field name */
    name: string;
    /** Field label */
    label?: string;
    /** Field description/help text */
    description?: string;
    /** Whether field is required */
    required?: boolean;
    /** Field error message */
    error?: string;
    /** Whether field is disabled */
    disabled?: boolean;
    /** Field content */
    children: React.ReactNode;
}

/**
 * Form section props
 */
export interface FormSectionProps extends BaseComponentProps {
    /** Section title */
    title?: string;
    /** Section description */
    description?: string;
    /** Whether section is collapsible */
    collapsible?: boolean;
    /** Default collapsed state */
    defaultCollapsed?: boolean;
    /** Section content */
    children: React.ReactNode;
    /** Whether section is bordered */
    bordered?: boolean;
}

/**
 * Form actions props
 */
export interface FormActionsProps extends BaseComponentProps {
    /** Action alignment */
    align?: 'left' | 'center' | 'right';
    /** Action content */
    children: React.ReactNode;
    /** Whether to show loading state */
    loading?: boolean;
    /** Whether actions are disabled */
    disabled?: boolean;
}

/**
 * Main FormLayout props
 */
export interface FormLayoutProps extends BaseComponentProps {
    /** Form content */
    children: React.ReactNode;
    /** Form title */
    title?: string;
    /** Form description */
    description?: string;
    /** Layout type */
    layout?: FormLayoutType;
    /** Number of columns for grid layout */
    columns?: 1 | 2 | 3 | 4;
    /** Spacing between fields */
    spacing?: FormSpacing;

    /** Form state */
    loading?: boolean;
    disabled?: boolean;

    /** Form submission */
    onSubmit?: () => void | Promise<void>;
    onCancel?: () => void;
    submitText?: string;
    cancelText?: string;
    submitDisabled?: boolean;
    submitLoading?: boolean;

    /** Actions configuration */
    actions?: React.ReactNode;
    actionsAlign?: 'left' | 'center' | 'right';
    showActions?: boolean;

    /** Custom components */
    header?: React.ReactNode;
    footer?: React.ReactNode;
    sidebar?: React.ReactNode;

    /** Responsive behavior */
    responsive?: boolean;
    stackedOnMobile?: boolean;
}