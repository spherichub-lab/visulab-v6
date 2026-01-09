/**
 * UI components index file
 * Central export point for all UI components
 */

// Basic UI components
export { Button } from './button';
export type { ButtonProps } from './button';

export { Input } from './input';
export type { InputProps } from './input';

export { Modal } from './modal';
export type { ModalProps } from './modal';

export { LoadingSpinner } from './loading';
export type { LoadingSpinnerProps } from './loading';

export { ErrorBoundary } from './error';
export type { ErrorBoundaryProps } from './error';

// Skeleton components
export {
    Skeleton,
    SkeletonText,
    SkeletonAvatar,
    SkeletonCard,
    SkeletonTable
} from './skeleton';
export type {
    SkeletonProps,
    SkeletonTextProps,
    SkeletonAvatarProps,
    SkeletonCardProps,
    SkeletonTableProps
} from './skeleton';