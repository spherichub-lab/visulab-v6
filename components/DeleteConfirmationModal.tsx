import React from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onEdit,
    onDelete
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão">
            <div className="space-y-6">
                {/* Warning Message */}
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex-shrink-0">
                        <Icon name="warning" className="!text-2xl text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">
                            Atenção: Ação Irreversível
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Esta ação não pode ser desfeita. O registro será permanentemente removido do sistema.
                        </p>
                    </div>
                </div>

                {/* Suggestion to Edit */}
                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex-shrink-0">
                        <Icon name="info" className="!text-2xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1">
                            Deseja apenas alterar os dados?
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            Se você quer apenas corrigir informações do registro, considere usar a opção de edição em vez de excluir.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <Icon name="edit" className="!text-base" />
                        Alterar
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                    >
                        <Icon name="delete" className="!text-base" />
                        Excluir
                    </button>
                </div>
            </div>
        </Modal>
    );
};
