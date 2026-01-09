/**
 * Common types for shared components
 * Shared type definitions used across multiple components
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
 * Common alignment options
 */
export type Alignment = 'left' | 'center' | 'right';

/**
 * Component size variants
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Common status types
 */
export type StatusType = 'success' | 'warning' | 'error' | 'info';