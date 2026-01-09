/**
 * FormLayout - Main form structure component
 * Provides consistent form layout with responsive behavior and validation integration
 */

import React, { useCallback } from 'react';
import { Button } from '../../ui';
import { cn } from '../../../utils';
import { FormLayoutProps } from './types';
import { FormField } from './FormField';
import { FormSection } from './FormSection';
import { FormActions } from './FormActions';

/**
 * Main FormLayout component
 */
export const FormLayout: React.FC<FormLayoutProps> = ({
    children,
    title,
    description,
    layout = 'vertical',
    columns = 1,
    spacing = 'normal',
    loading = false,
    disabled = false,
    onSubmit,
    onCancel,
    submitText = 'Salvar',
    cancelText = 'Cancelar',
    submitDisabled = false,
    submitLoading = false,
    actions,
    actionsAlign = 'right',
    showActions = true,
    header,
    footer,
    sidebar,
    responsive = true,
    stackedOnMobile = true,
    className,
    testId,
}) => {
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (onSubmit && !loading && !disabled && !submitDisabled) {
            await onSubmit();
        }
    }, [onSubmit, loading, disabled, submitDisabled]);

    const handleCancel = useCallback(() => {
        if (onCancel) {
            onCancel();
        }
    }, [onCancel]);

    // Layout classes
    const containerClasses = cn(
        'w-full',
        {
            'max-w-2xl mx-auto': layout === 'vertical',
        },
        className
    );

    const contentClasses = cn(
        'space-y-6',
        {
            'grid gap-6': layout === 'grid',
            'grid-cols-1': layout === 'grid' && columns === 1,
            'grid-cols-2': layout === 'grid' && columns === 2,
            'grid-cols-3': layout === 'grid' && columns === 3,
            'grid-cols-4': layout === 'grid' && columns === 4,
            'md:grid-cols-1': layout === 'grid' && columns > 1 && stackedOnMobile,
            'md:grid-cols-2': layout === 'grid' && columns >= 2 && stackedOnMobile,
            'md:grid-cols-3': layout === 'grid' && columns >= 3 && stackedOnMobile,
            'md:grid-cols-4': layout === 'grid' && columns >= 4 && stackedOnMobile,
            'gap-2': spacing === 'compact',
            'gap-6': spacing === 'normal',
            'gap-8': spacing === 'loose',
            'flex flex-col': layout === 'horizontal',
            'md:flex-row md:space-x-6': layout === 'horizontal' && responsive,
        }
    );

    const headerClasses = cn(
        'mb-6 pb-4 border-b border-slate-200 dark:border-slate-700'
    );

    const footerClasses = cn(
        'mt-6 pt-4 border-t border-slate-200 dark:border-slate-700'
    );

    const sidebarClasses = cn(
        'hidden lg:block lg:w-64 lg:pl-6'
    );

    const mainContentClasses = cn(
        'flex-1',
        sidebar && 'lg:pr-6'
    );

    // Default actions
    const defaultActions = showActions && !actions && (
        <FormActions align={actionsAlign} loading={submitLoading} disabled={disabled}>
            {onCancel && (
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading || disabled}
                    type="button"
                >
                    {cancelText}
                </Button>
            )}

            <Button
                onClick={handleSubmit}
                loading={submitLoading}
                disabled={submitDisabled || loading || disabled}
                type="submit"
            >
                {submitText}
            </Button>
        </FormActions>
    );

    return (
        <div
            className={containerClasses}
            data-testid={testId}
        >
            {/* Custom header */}
            {(header || title || description) && (
                <div className={headerClasses}>
                    {header || (
                        <div>
                            {title && (
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="text-slate-600 dark:text-slate-400">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Form content with optional sidebar */}
            <div className={cn('flex flex-col lg:flex-row', responsive && 'lg:space-x-6')}>
                <div className={mainContentClasses}>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className={contentClasses}>
                            {children}
                        </div>

                        {/* Custom actions or default actions */}
                        {actions || defaultActions}
                    </form>
                </div>

                {/* Sidebar */}
                {sidebar && (
                    <div className={sidebarClasses}>
                        {sidebar}
                    </div>
                )}
            </div>

            {/* Custom footer */}
            {footer && (
                <div className={footerClasses}>
                    {footer}
                </div>
            )}

            {/* Loading overlay */}
            {loading && (
                <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin border-2 border-primary-600 border-t-transparent rounded-full w-8 h-8 mb-2" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Processando...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

FormLayout.displayName = 'FormLayout';

// Attach subcomponents as static properties
FormLayout.Field = FormField;
FormLayout.Section = FormSection;
FormLayout.Actions = FormActions;

export default FormLayout;