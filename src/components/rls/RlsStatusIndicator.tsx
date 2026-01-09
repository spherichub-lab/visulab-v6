/**
 * RLS Status Indicator Component
 * Displays the current RLS (Row Level Security) status for data access
 */

import React from 'react';
import { Icon } from '../../../components/Icon';
import { cn } from '../../../src/utils';

// RLS status types
export type RlsStatus = 'enforced' | 'bypassed' | 'unknown' | 'error';

// RLS status indicator props
export interface RlsStatusIndicatorProps {
    status: RlsStatus;
    userRole?: string;
    empresaId?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    testId?: string;
}

/**
 * Get status configuration
 */
const getStatusConfig = (status: RlsStatus) => {
    switch (status) {
        case 'enforced':
            return {
                icon: 'shield',
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-100 dark:bg-green-900/30',
                label: 'RLS Ativo',
                description: 'Políticas de segurança de nível de linha estão sendo aplicadas.'
            };
        case 'bypassed':
            return {
                icon: 'warning',
                color: 'text-amber-600 dark:text-amber-400',
                bgColor: 'bg-amber-100 dark:bg-amber-900/30',
                label: 'RLS Bypassed',
                description: 'Políticas de segurança podem ter sido ignoradas.'
            };
        case 'error':
            return {
                icon: 'error',
                color: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-100 dark:bg-red-900/30',
                label: 'Erro RLS',
                description: 'Erro ao verificar políticas de segurança.'
            };
        case 'unknown':
        default:
            return {
                icon: 'help',
                color: 'text-slate-600 dark:text-slate-400',
                bgColor: 'bg-slate-100 dark:bg-slate-800/50',
                label: 'RLS Desconhecido',
                description: 'Status de segurança não determinado.'
            };
    }
};

/**
 * Get size classes
 */
const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return {
                container: 'px-2 py-1 gap-1.5',
                icon: '!text-sm',
                text: 'text-xs'
            };
        case 'lg':
            return {
                container: 'px-4 py-2 gap-2',
                icon: '!text-lg',
                text: 'text-sm'
            };
        case 'md':
        default:
            return {
                container: 'px-3 py-1.5 gap-1.5',
                icon: '!text-base',
                text: 'text-xs'
            };
    }
};

/**
 * RLS Status Indicator Component
 */
export const RlsStatusIndicator: React.FC<RlsStatusIndicatorProps> = ({
    status,
    userRole,
    empresaId,
    showLabel = true,
    size = 'md',
    className,
    testId = 'rls-status-indicator'
}) => {
    const config = getStatusConfig(status);
    const sizeClasses = getSizeClasses(size as 'sm' | 'md' | 'lg');

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full',
                config.bgColor,
                sizeClasses.container,
                className
            )}
            data-testid={testId}
            data-status={status}
            title={config.description}
        >
            <Icon
                name={config.icon}
                className={cn(config.color, sizeClasses.icon)}
            />
            {showLabel && (
                <span className={cn('font-medium', config.color, sizeClasses.text)}>
                    {config.label}
                </span>
            )}
        </div>
    );
};

/**
 * RLS Status Badge Component (compact version)
 */
export interface RlsStatusBadgeProps {
    status: RlsStatus;
    size?: 'sm' | 'md';
    className?: string;
}

export const RlsStatusBadge: React.FC<RlsStatusBadgeProps> = ({
    status,
    size = 'sm',
    className
}) => {
    const config = getStatusConfig(status);
    const sizeClasses = getSizeClasses(size as 'sm' | 'md' | 'lg');

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full',
                config.bgColor,
                sizeClasses.container,
                className
            )}
            data-testid="rls-status-badge"
            data-status={status}
        >
            <Icon
                name={config.icon}
                className={cn(config.color, sizeClasses.icon)}
            />
        </div>
    );
};

/**
 * RLS Context Display Component
 * Shows user's access context (role, company, etc.)
 */
export interface RlsContextDisplayProps {
    userRole?: string;
    empresaId?: string;
    empresaName?: string;
    status: RlsStatus;
    className?: string;
}

export const RlsContextDisplay: React.FC<RlsContextDisplayProps> = ({
    userRole,
    empresaId,
    empresaName,
    status,
    className
}) => {
    return (
        <div
            className={cn(
                'flex flex-col gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',
                className
            )}
            data-testid="rls-context-display"
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Contexto de Acesso
                </span>
                <RlsStatusBadge status={status} size="sm" />
            </div>

            <div className="space-y-1">
                {userRole && (
                    <div className="flex items-center gap-2 text-sm">
                        <Icon name="person" className="!text-sm text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-300">
                            Cargo: <span className="font-medium">{userRole}</span>
                        </span>
                    </div>
                )}

                {empresaId && (
                    <div className="flex items-center gap-2 text-sm">
                        <Icon name="business" className="!text-sm text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-300">
                            Empresa: <span className="font-medium">{empresaName || empresaId}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

RlsStatusIndicator.displayName = 'RlsStatusIndicator';
RlsStatusBadge.displayName = 'RlsStatusBadge';
RlsContextDisplay.displayName = 'RlsContextDisplay';

export default RlsStatusIndicator;
