/**
 * EmpresaModal - Reusable modal for creating/editing empresas
 * Integrates with useEmpresaForm and domain hooks
 */

import React from 'react';
import { Modal } from '../../components/Modal';
import { EmpresaForm } from './EmpresaForm';
import { EmpresaFormData } from '../types/domain/domain.types';
import { useCreateEmpresa, useUpdateEmpresa } from '../hooks/domain/empresas';
import { showSuccess, showWarning } from '../utils/errorHandler';

interface EmpresaModalProps {
    isOpen: boolean;
    onClose: () => void;
    empresa?: any; // Empresa data for edit mode
    mode: 'create' | 'edit';
    existingEmpresas?: any[];
}

export const EmpresaModal: React.FC<EmpresaModalProps> = ({
    isOpen,
    onClose,
    empresa,
    mode,
    existingEmpresas = []
}) => {
    const createMutation = useCreateEmpresa();
    const updateMutation = useUpdateEmpresa();

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    // Prepare initial data for edit mode
    const initialData = React.useMemo(() => {
        if (mode === 'edit' && empresa) {
            return {
                nome: empresa.nome || '',
                tipo: empresa.tipo || 'Fornecedor',
                contato_nome: empresa.contato_nome || '',
                contato_email: empresa.contato_email || '',
                status: empresa.status || 'Ativa'
            };
        }
        return {};
    }, [mode, empresa]);

    const handleSubmit = async (data: EmpresaFormData) => {
        try {
            if (mode === 'edit' && empresa?.id) {
                await updateMutation.mutateAsync({
                    id: empresa.id,
                    data
                });
                showSuccess('Empresa atualizada com sucesso!');
            } else {
                await createMutation.mutateAsync(data);
                showSuccess('Empresa criada com sucesso!');
            }
            onClose();
        } catch (error) {
            console.error('Error saving empresa:', error);
            showWarning(
                mode === 'edit'
                    ? 'Erro ao atualizar empresa. Tente novamente.'
                    : 'Erro ao criar empresa. Tente novamente.'
            );
        }
    };

    const handleSuccess = () => {
        // Form will be reset by EmpresaForm
        // Additional success handling can be added here if needed
    };

    const handleError = (error: Error) => {
        console.error('Form error:', error);
        // Error is already handled in handleSubmit, but we can add additional logic here
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'edit' ? 'Editar Empresa' : 'Nova Empresa'}
        >
            <div className="space-y-4">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {mode === 'edit'
                        ? 'Edite as informações da empresa abaixo.'
                        : 'Preencha as informações para criar uma nova empresa.'
                    }
                </div>

                <EmpresaForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    mode={mode}
                    existingEmpresas={existingEmpresas}
                />
            </div>
        </Modal>
    );
};

export default EmpresaModal;