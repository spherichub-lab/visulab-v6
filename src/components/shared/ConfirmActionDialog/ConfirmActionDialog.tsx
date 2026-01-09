/**
 * ConfirmActionDialog - Critical action confirmation dialog
 * Provides consistent confirmation interface with severity levels and accessibility
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../../../components/Icon';
import { Button } from '../../ui';
import { cn } from '../../../utils';
import {
    ConfirmActionDialogProps,
    ActionSeverity,
    DialogVariant,
    ConfirmActionItem
} from './types';

/**
 * Default configurations for different severity levels
 */
const severityConfigs = {
    low: {
        icon: 'info',
        variant: 'default' as DialogVariant,
        confirmVariant: 'primary' as const,
        confirmText: 'Confirmar',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    medium: {
        icon: 'warning',
        variant: 'warning' as DialogVariant,
        confirmVariant: 'warning' as const,
        confirmText: 'Confirmar',
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    high: {
        icon: 'warning',
        variant: 'warning' as DialogVariant,
        confirmVariant: 'danger' as const,
        confirmText: 'Confirmar Ação',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    critical: {
        icon: 'delete_forever',
        variant: 'destructive' as DialogVariant,
        confirmVariant: 'danger' as const,
        confirmText: 'Excluir Permanentemente',
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
};

/**
 * Size configurations
 */
const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

/**
 * Main ConfirmActionDialog component
 */
export const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    warning,
    item,
    confirmText,
    cancelText = 'Cancelar',
    severity = 'medium',
    variant,
    loading = false,
    disabled = false,
    closeOnConfirm = true,
    icon,
    size = 'md',
    header,
    content,
    actions,
    closeOnEscape = true,
    closeOnBackdrop = true,
    preventClose = false,
    className,
    testId,
}) => {
    // Generate confirm button testId based on title
    const getConfirmTestId = () => {
        if (title?.toLowerCase().includes('aprovar')) return 'btn-confirm-approve';
        if (title?.toLowerCase().includes('rejeitar')) return 'btn-confirm-reject';
        return 'btn-confirm-delete';
    };
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    // Get configuration based on severity
    const config = severityConfigs[severity];
    const finalVariant = variant || config.variant;
    const finalIcon = icon || config.icon;
    const finalConfirmText = confirmText || config.confirmText;

    // Handle confirmation
    const handleConfirm = async () => {
        if (disabled || loading || isClosing) return;

        setIsClosing(true);
        try {
            await onConfirm();

            if (closeOnConfirm) {
                onClose();
            }
        } catch (error) {
            console.error('Error in confirm action:', error);
        } finally {
            setIsClosing(false);
        }
    };

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Close on Escape
            if (e.key === 'Escape' && closeOnEscape && !preventClose) {
                e.preventDefault();
                onClose();
                return;
            }

            // Trap focus within modal
            if (e.key === 'Tab') {
                const modal = modalRef.current;
                if (!modal) return;

                const focusableElements = modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                ) as NodeListOf<HTMLElement>;

                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, preventClose, onClose]);

    // Handle focus management
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Focus modal after a small delay
            setTimeout(() => {
                if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 100);
        } else {
            // Restore body scroll
            document.body.style.overflow = '';

            // Restore focus
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        }
    }, [isOpen]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdrop && !preventClose) {
            onClose();
        }
    };

    if (!isOpen) return null;

    // Render item information
    const renderItemInfo = () => {
        if (!item) return null;

        return (
            <div className={cn(
                'flex items-center gap-4 p-4 rounded-lg border',
                config.bgColor
            )}>
                {/* Avatar */}
                {item.avatar && (
                    <div className="flex-shrink-0">
                        {item.avatar}
                    </div>
                )}

                {/* Item details */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                        {item.name}
                    </h4>

                    {item.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {item.description}
                        </p>
                    )}

                    {/* Metadata */}
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <dl className="mt-3 space-y-1">
                            {Object.entries(item.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                    <dt className="text-slate-500 dark:text-slate-400">
                                        {key}:
                                    </dt>
                                    <dd className="font-medium text-slate-900 dark:text-white ml-2">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>
            </div>
        );
    };

    // Render default actions
    const renderDefaultActions = () => (
        <div className="flex gap-3 justify-end">
            <Button
                variant="outline"
                onClick={onClose}
                disabled={loading || isClosing}
                type="button"
            >
                {cancelText}
            </Button>

            <Button
                variant={config.confirmVariant}
                onClick={handleConfirm}
                loading={loading || isClosing}
                disabled={disabled}
                type="button"
                data-testid={getConfirmTestId()}
            >
                <Icon name={finalIcon} className="!text-sm mr-2" />
                {finalConfirmText}
            </Button>
        </div>
    );

    const modalContent = (
        <div
            ref={modalRef}
            className={cn(
                'relative w-full bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 transform transition-all max-h-[90vh] flex flex-col',
                sizeClasses[size],
                className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            tabIndex={-1}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={cn('p-2 rounded-lg', config.bgColor)}>
                        <Icon
                            name={finalIcon}
                            className={cn('!text-2xl', config.color)}
                        />
                    </div>

                    {/* Title */}
                    <h3
                        id="dialog-title"
                        className="text-lg md:text-xl font-bold text-slate-900 dark:text-white"
                    >
                        {title || 'Confirmar Ação'}
                    </h3>
                </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto custom-scrollbar flex-1 p-6 md:p-8">
                {header && (
                    <div className="mb-6">
                        {header}
                    </div>
                )}

                {content ? (
                    <div>{content}</div>
                ) : (
                    <div className="space-y-6">
                        {/* Description */}
                        {description && (
                            <p className="text-slate-600 dark:text-slate-400 text-center">
                                {description}
                            </p>
                        )}

                        {/* Item information */}
                        {renderItemInfo()}

                        {/* Warning */}
                        {warning && (
                            <div className={cn(
                                'p-4 rounded-lg border',
                                finalVariant === 'destructive'
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                            )}>
                                <div className="flex items-start gap-2">
                                    <Icon
                                        name="warning"
                                        className={cn(
                                            '!text-lg mt-0.5',
                                            finalVariant === 'destructive' ? 'text-red-500' : 'text-amber-500'
                                        )}
                                    />
                                    <p className={cn(
                                        'text-sm',
                                        finalVariant === 'destructive' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
                                    )}>
                                        <strong>Importante:</strong> {warning}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-700 shrink-0">
                {actions || renderDefaultActions()}
            </div>
        </div>
    );

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={handleBackdropClick}
            role="presentation"
            data-testid={testId || "confirm-dialog"}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative z-10 w-full">
                {modalContent}
            </div>
        </div>,
        document.body
    );
};

ConfirmActionDialog.displayName = 'ConfirmActionDialog';

export default ConfirmActionDialog;