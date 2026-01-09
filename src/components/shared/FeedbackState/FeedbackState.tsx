/**
 * FeedbackState - Unified feedback component for various states
 * Provides consistent loading, empty, error, success, warning, and info states
 */

import React from 'react';
import { Icon } from '../../../../components/Icon';
import { Button } from '../../ui';
import { LoadingSpinner } from '../../ui';
import { cn } from '../../../utils';
import {
    FeedbackStateProps,
    FeedbackType,
    FeedbackVariant,
    FeedbackAction
} from './types';

/**
 * Default icons for each feedback type
 */
const getDefaultIcon = (type: FeedbackType): string => {
    const iconMap = {
        loading: 'hourglass_empty',
        empty: 'inbox',
        error: 'error',
        success: 'check_circle',
        warning: 'warning',
        info: 'info',
    };

    return iconMap[type] || 'info';
};

/**
 * Default colors for each feedback type
 */
const getDefaultColor = (type: FeedbackType): string => {
    const colorMap = {
        loading: 'text-slate-400',
        empty: 'text-slate-400',
        error: 'text-red-500',
        success: 'text-emerald-500',
        warning: 'text-amber-500',
        info: 'text-blue-500',
    };

    return colorMap[type] || 'text-slate-400';
};

/**
 * Render action button or link
 */
const renderAction = (action: React.ReactNode | FeedbackAction) => {
    if (!action) return null;

    if (React.isValidElement(action)) {
        return action;
    }

    if (typeof action === 'object' && 'label' in action) {
        const actionObj = action as FeedbackAction;
        return (
            <Button
                variant={actionObj.variant || 'primary'}
                onClick={actionObj.onClick}
                loading={actionObj.loading}
                className="mt-6"
            >
                {actionObj.icon && (
                    <Icon name={actionObj.icon} className="!text-sm mr-2" />
                )}
                {actionObj.label}
            </Button>
        );
    }

    return null;
};

/**
 * Main FeedbackState component
 */
export const FeedbackState: React.FC<FeedbackStateProps> = ({
    type,
    variant = 'full',
    size = 'md',
    title,
    description,
    action,
    icon,
    iconProps,
    error,
    onRetry,
    retryText = 'Tentar novamente',
    children,
    animated = true,
    animationDuration = 300,
    className,
    testId,
}) => {
    // Get default values based on type
    const defaultIcon = getDefaultIcon(type);
    const defaultColor = getDefaultColor(type);
    const finalIcon = icon || defaultIcon;
    const finalColor = iconProps?.className ? '' : defaultColor;

    // Size configurations
    const sizeClasses = {
        sm: 'py-8',
        md: 'py-12',
        lg: 'py-16',
    };

    const iconSizeClasses = {
        sm: '!text-2xl',
        md: '!text-4xl',
        lg: '!text-5xl',
    };

    // Variant configurations
    const variantClasses = {
        inline: 'flex items-center gap-3 text-sm',
        full: 'flex flex-col items-center justify-center',
        modal: 'flex flex-col items-center justify-center p-8',
        card: 'flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-surface-dark',
    };

    // Animation classes
    const animationClasses = animated
        ? `transition-all duration-${animationDuration}`
        : '';

    // Default titles for each type
    const defaultTitles = {
        loading: 'Carregando...',
        empty: 'Nenhum dado encontrado',
        error: 'Ocorreu um erro',
        success: 'Operação concluída',
        warning: 'Atenção',
        info: 'Informação',
    };

    const finalTitle = title || defaultTitles[type];

    const containerClasses = cn(
        'w-full',
        sizeClasses[size],
        variantClasses[variant],
        animationClasses,
        className
    );

    const iconClasses = cn(
        iconSizeClasses[size],
        finalColor,
        iconProps?.className
    );

    const renderContent = () => {
        if (children) {
            return children;
        }

        return (
            <>
                {/* Icon */}
                <Icon
                    name={finalIcon}
                    className={iconClasses}
                    style={iconProps?.size ? { fontSize: iconProps.size } : {}}
                />

                {/* Title */}
                {finalTitle && (
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4 mb-2 text-center">
                        {finalTitle}
                    </h3>
                )}

                {/* Description */}
                {description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 max-w-md">
                        {description}
                    </p>
                )}

                {/* Error details */}
                {type === 'error' && error?.message && !description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 max-w-md">
                        {error.message}
                    </p>
                )}

                {/* Retry button for errors */}
                {type === 'error' && onRetry && (
                    <Button
                        variant="outline"
                        onClick={onRetry}
                        className="mt-6"
                    >
                        <Icon name="refresh" className="!text-sm mr-2" />
                        {retryText}
                    </Button>
                )}

                {/* Custom action */}
                {type !== 'error' && renderAction(action)}

                {/* Loading spinner for loading state */}
                {type === 'loading' && (
                    <div className="mt-4">
                        <LoadingSpinner size={size} />
                    </div>
                )}
            </>
        );
    };

    return (
        <div
            className={containerClasses}
            role={type === 'error' ? 'alert' : 'status'}
            aria-live={type === 'error' ? 'assertive' : 'polite'}
            data-testid={testId}
        >
            {renderContent()}
        </div>
    );
};

FeedbackState.displayName = 'FeedbackState';

export default FeedbackState;