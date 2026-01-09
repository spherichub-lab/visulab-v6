/**
 * Modal - Reusable modal component with accessibility
 * Built with design tokens and accessibility in mind
 */

import React, { useEffect, useRef, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../../../components/Icon';
import { cn } from '../../../utils';
import { useErrorHandling } from '../../../hooks/ui/useErrorHandling';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
    showCloseButton?: boolean;
    className?: string;
    overlayClassName?: string;
    contentClassName?: string;
}

// Size configurations
const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

/**
 * Reusable Modal component with accessibility
 */
export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    closeOnEscape = true,
    closeOnBackdrop = true,
    showCloseButton = true,
    className,
    overlayClassName,
    contentClassName,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const { handleError } = useErrorHandling({ showToast: false });

    // Save current focus element
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Focus modal after a small delay to ensure it's rendered
            setTimeout(() => {
                if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 100);
        } else {
            // Restore body scroll
            document.body.style.overflow = '';

            // Restore focus to previous element
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Close on Escape
            if (e.key === 'Escape' && closeOnEscape) {
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
    }, [isOpen, closeOnEscape]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose();
        }
    };

    // Handle close button click
    const handleClose = () => {
        try {
            onClose();
        } catch (error) {
            handleError(error as Error, { context: 'Modal close' });
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div
            ref={modalRef}
            className={cn(
                'relative w-full bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 transform transition-all max-h-[90vh] flex flex-col',
                sizeClasses[size],
                contentClassName
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <h3
                    id="modal-title"
                    className="text-lg md:text-xl font-bold text-slate-900 dark:text-white"
                >
                    {title}
                </h3>

                {showCloseButton && (
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Fechar modal"
                        type="button"
                    >
                        <Icon name="close" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto custom-scrollbar flex-1 p-6 md:p-8">
                {children}
            </div>
        </div>
    );

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center px-4',
                overlayClassName
            )}
            onClick={handleBackdropClick}
            role="presentation"
            data-testid="modal"
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

export default Modal;