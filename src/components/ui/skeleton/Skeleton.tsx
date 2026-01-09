/**
 * Skeleton - Loading placeholder component
 * Provides visual feedback while content is loading
 */

import React from 'react';
import { cn } from '../../../utils';

export interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
    testId?: string;
}

const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
};

const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_1.5s_infinite]',
    none: '',
};

/**
 * Skeleton component for loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
    testId,
}) => {
    const classes = cn(
        'bg-slate-200 dark:bg-slate-700',
        variantClasses[variant],
        animationClasses[animation],
        className
    );

    const style: React.CSSProperties = {};
    if (width) {
        style.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height) {
        style.height = typeof height === 'number' ? `${height}px` : height;
    }

    return (
        <div
            className={classes}
            style={style}
            role="status"
            aria-label="Carregando"
            data-testid={testId}
        >
            <span className="sr-only">Carregando...</span>
        </div>
    );
};

/**
 * SkeletonText - Text skeleton variant
 */
export interface SkeletonTextProps {
    lines?: number;
    className?: string;
    width?: string | number;
    testId?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 3,
    className,
    width,
    testId,
}) => {
    return (
        <div className={cn('space-y-2', className)} data-testid={testId}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    variant="text"
                    width={width}
                    height={16}
                    className={index === lines - 1 && width ? '' : 'w-full'}
                />
            ))}
        </div>
    );
};

/**
 * SkeletonAvatar - Avatar skeleton variant
 */
export interface SkeletonAvatarProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    testId?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
};

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
    size = 'md',
    className,
    testId,
}) => {
    return (
        <Skeleton
            variant="circular"
            className={cn(sizeClasses[size], className)}
            testId={testId}
        />
    );
};

/**
 * SkeletonCard - Card skeleton variant
 */
export interface SkeletonCardProps {
    className?: string;
    showAvatar?: boolean;
    testId?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    className,
    showAvatar = true,
    testId,
}) => {
    return (
        <div
            className={cn('p-4 border border-slate-200 dark:border-slate-600 rounded-lg', className)}
            data-testid={testId}
        >
            {showAvatar && (
                <div className="flex items-center gap-4 mb-4">
                    <SkeletonAvatar size="md" />
                    <div className="flex-1">
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="40%" height={16} />
                    </div>
                </div>
            )}
            <SkeletonText lines={3} />
        </div>
    );
};

/**
 * SkeletonTable - Table skeleton variant
 */
export interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    className?: string;
    testId?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
    rows = 5,
    columns = 4,
    className,
    testId,
}) => {
    return (
        <div className={cn('space-y-3', className)} data-testid={testId}>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            variant="rectangular"
                            height={40}
                            className="flex-1"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

Skeleton.displayName = 'Skeleton';
SkeletonText.displayName = 'SkeletonText';
SkeletonAvatar.displayName = 'SkeletonAvatar';
SkeletonCard.displayName = 'SkeletonCard';
SkeletonTable.displayName = 'SkeletonTable';

export default Skeleton;
