/**
 * FeedbackState component TypeScript interfaces
 * Defines public API and contracts for FeedbackState functionality
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
 * Feedback state types
 */
export type FeedbackType = 'loading' | 'empty' | 'error' | 'success' | 'warning' | 'info';

/**
 * Feedback variant
 */
export type FeedbackVariant = 'inline' | 'full' | 'modal' | 'card';

/**
 * Component size
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Icon configuration
 */
export interface FeedbackIconProps {
    /** Icon name */
    name?: string;
    /** Icon size */
    size?: string;
    /** Icon custom class name */
    className?: string;
}

/**
 * Feedback action
 */
export interface FeedbackAction {
    /** Action label */
    label: string;
    /** Action callback */
    onClick: () => void;
    /** Action variant */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    /** Action icon */
    icon?: string;
    /** Whether action is loading */
    loading?: boolean;
}

/**
 * Main FeedbackState props
 */
export interface FeedbackStateProps extends BaseComponentProps {
    /** Feedback type */
    type: FeedbackType;
    /** Feedback variant */
    variant?: FeedbackVariant;
    /** Component size */
    size?: ComponentSize;

    /** Content */
    title?: string;
    description?: string;
    action?: React.ReactNode | FeedbackAction;

    /** Icon configuration */
    icon?: string;
    iconProps?: FeedbackIconProps;

    /** Error specific */
    error?: Error;
    onRetry?: () => void;
    retryText?: string;

    /** Custom content */
    children?: React.ReactNode;

    /** Animation */
    animated?: boolean;
    animationDuration?: number;
}