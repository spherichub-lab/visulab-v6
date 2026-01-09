/**
 * ConfirmActionDialog component TypeScript interfaces
 * Defines public API and contracts for ConfirmActionDialog functionality
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
 * Component size
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Action severity levels
 */
export type ActionSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Dialog variant
 */
export type DialogVariant = 'default' | 'destructive' | 'warning' | 'success';

/**
 * Item information
 */
export interface ConfirmActionItem {
    /** Item name */
    name: string;
    /** Item description */
    description?: string;
    /** Item avatar/icon */
    avatar?: React.ReactNode;
    /** Additional metadata */
    metadata?: Record<string, any>;
}

/**
 * Dialog action
 */
export interface ConfirmDialogAction {
    /** Action label */
    label: string;
    /** Action callback */
    onClick: () => void | Promise<void>;
    /** Action variant */
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    /** Action icon */
    icon?: string;
    /** Whether action is loading */
    loading?: boolean;
    /** Whether action is disabled */
    disabled?: boolean;
}

/**
 * Main ConfirmActionDialog props
 */
export interface ConfirmActionDialogProps extends BaseComponentProps {
    /** Dialog state */
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;

    /** Content */
    title?: string;
    description?: string;
    warning?: string;

    /** Item information */
    item?: ConfirmActionItem;

    /** Action configuration */
    confirmText?: string;
    cancelText?: string;
    severity?: ActionSeverity;
    variant?: DialogVariant;

    /** State */
    loading?: boolean;
    disabled?: boolean;
    closeOnConfirm?: boolean;

    /** Icon configuration */
    icon?: string;

    /** Dialog size */
    size?: ComponentSize;

    /** Custom sections */
    header?: React.ReactNode;
    content?: React.ReactNode;
    actions?: React.ReactNode;

    /** Accessibility */
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
    preventClose?: boolean;
}