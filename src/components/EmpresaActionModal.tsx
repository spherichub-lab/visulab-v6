/**
 * EmpresaActionModal - Modal for confirming empresa actions (delete, activate, deactivate)
 * Provides clear options for different types of actions
 */

import React from 'react';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';

interface Empresa {
    id: string;
    nome: string;
    tipo: string;
    status: 'Ativa' | 'Inativa';
}

type ActionMode = 'delete' | 'deactivate' | 'activate';

interface EmpresaActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    empresa: Empresa | null;
    mode: ActionMode;
    onConfirm: () => Promise<void>;
    isLoading?: boolean;
}

const getActionConfig = (mode: ActionMode, empresa: Empresa | null) => {
    const configs = {
        delete: {
            title: 'Excluir Empresa',
            icon: 'delete_forever',
            iconBg: 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-900/30',
            description: `Tem certeza que deseja excluir permanentemente "${empresa?.nome}"?`,
            warning: 'Esta ação não pode ser desfeita.',
            confirmText: 'Excluir Permanentemente',
            confirmBg: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30',
            confirmIcon: 'delete_forever'
        },
        deactivate: {
            title: 'Desativar Empresa',
            icon: 'block',
            iconBg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 border-amber-100 dark:border-amber-900/30',
            description: `Tem certeza que deseja desativar "${empresa?.nome}"?`,
            warning: 'A empresa permanecerá no sistema mas não poderá ser utilizada.',
            confirmText: 'Apenas Desativar',
            confirmBg: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
            confirmIcon: 'block'
        },
        activate: {
            title: 'Ativar Empresa',
            icon: 'check_circle',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border-emerald-100 dark:border-emerald-900/30',
            description: `Tem certeza que deseja ativar "${empresa?.nome}"?`,
            warning: 'A empresa estará disponível para uso novamente.',
            confirmText: 'Ativar Empresa',
            confirmBg: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
            confirmIcon: 'check_circle'
        }
    };

    return configs[mode];
};

export const EmpresaActionModal: React.FC<EmpresaActionModalProps> = ({
    isOpen,
    onClose,
    empresa,
    mode,
    onConfirm,
    isLoading = false
}) => {
    const config = getActionConfig(mode, empresa);

    const handleConfirm = async () => {
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Error performing action:', error);
        }
    };

    if (!empresa) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={config.title}>
            <div className="flex flex-col gap-6">
                {/* Icon and Warning */}
                <div className="text-center">
                    <div className={`h-14 w-14 mx-auto ${config.iconBg} rounded-full flex items-center justify-center mb-4 border`}>
                        <Icon name={config.icon} className="!text-2xl" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {config.description}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm px-4">
                        {config.warning}
                    </p>
                </div>

                {/* Company Info */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {empresa.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                                {empresa.nome}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {empresa.tipo} • {empresa.status}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-colors border flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${config.confirmBg}`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Processando...
                            </>
                        ) : (
                            <>
                                <Icon name={config.confirmIcon} className="!text-lg" />
                                {config.confirmText}
                            </>
                        )}
                    </button>

                    {mode === 'delete' && (
                        <button
                            onClick={() => onClose()}
                            disabled={isLoading}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                    )}

                    {mode === 'deactivate' && (
                        <>
                            <button
                                onClick={() => onClose()}
                                disabled={isLoading}
                                className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm transition-colors border border-red-100 dark:border-red-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Icon name="delete_forever" className="!text-lg mr-2" />
                                Excluir Permanentemente
                            </button>
                            <button
                                onClick={() => onClose()}
                                disabled={isLoading}
                                className="w-full py-2 text-slate-500 dark:text-slate-400 font-semibold text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                        </>
                    )}

                    {mode === 'activate' && (
                        <button
                            onClick={() => onClose()}
                            disabled={isLoading}
                            className="w-full py-2 text-slate-500 dark:text-slate-400 font-semibold text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EmpresaActionModal;