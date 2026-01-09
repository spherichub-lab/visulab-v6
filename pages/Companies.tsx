/**
 * Companies page - Complete UI for empresa management
 * Uses domain hooks with TanStack Query and modern React patterns
 * Refactored to use shared components for consistency and reusability
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { Empresa as DatabaseEmpresa } from '../lib/types/database/entities.types';
import {
    DataTable,
    DataTableColumn,
    DataTableAction,
    FormLayout,
    FeedbackState
} from '../src/components/shared';
import { Button, Input } from '../src/components/ui';
import {
    useEmpresasList,
    useEmpresasSearch,
    useCreateEmpresa,
    useUpdateEmpresa
} from '../src/hooks/domain/empresas';
import { EmpresaFilters, EmpresaFormData } from '../src/types/domain/domain.types';
import { showSuccess, showWarning, showInfo } from '../src/utils/errorHandler';

// Types
// Use the Empresa type from the database entities
type Empresa = {
    id: string;
    nome: string;
    tipo: string;
    status: 'Ativa' | 'Inativa';
    contato_nome?: string;
    contato_email?: string;
    created_at?: string;
};

const Companies: React.FC = () => {
    // Generate a consistent color for each company based on its ID
    const getCompanyColor = useCallback((empresaId: string) => {
        const colors = [
            { bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-600', darkText: 'dark:text-blue-400', border: 'border-blue-200', darkBorder: 'dark:border-blue-800' },
            { bg: 'bg-emerald-100', darkBg: 'dark:bg-emerald-900/30', text: 'text-emerald-600', darkText: 'dark:text-emerald-400', border: 'border-emerald-200', darkBorder: 'dark:border-emerald-800' },
            { bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', text: 'text-purple-600', darkText: 'dark:text-purple-400', border: 'border-purple-200', darkBorder: 'dark:border-purple-800' },
            { bg: 'bg-rose-100', darkBg: 'dark:bg-rose-900/30', text: 'text-rose-600', darkText: 'dark:text-rose-400', border: 'border-rose-200', darkBorder: 'dark:border-rose-800' },
            { bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', text: 'text-amber-600', darkText: 'dark:text-amber-400', border: 'border-amber-200', darkBorder: 'dark:border-amber-800' },
            { bg: 'bg-cyan-100', darkBg: 'dark:bg-cyan-900/30', text: 'text-cyan-600', darkText: 'dark:text-cyan-400', border: 'border-cyan-200', darkBorder: 'dark:border-cyan-800' },
            { bg: 'bg-indigo-100', darkBg: 'dark:bg-indigo-900/30', text: 'text-indigo-600', darkText: 'dark:text-indigo-400', border: 'border-indigo-200', darkBorder: 'dark:border-indigo-800' },
            { bg: 'bg-pink-100', darkBg: 'dark:bg-pink-900/30', text: 'text-pink-600', darkText: 'dark:text-pink-400', border: 'border-pink-200', darkBorder: 'dark:border-pink-800' },
            { bg: 'bg-teal-100', darkBg: 'dark:bg-teal-900/30', text: 'text-teal-600', darkText: 'dark:text-teal-400', border: 'border-teal-200', darkBorder: 'dark:border-teal-800' },
            { bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', text: 'text-orange-600', darkText: 'dark:text-orange-400', border: 'border-orange-200', darkBorder: 'dark:border-orange-800' },
        ];

        // Use the company ID to generate a consistent index
        const hash = empresaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colorIndex = hash % colors.length;
        return colors[colorIndex];
    }, []);

    // State for modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState<DatabaseEmpresa | null>(null);

    // State for search
    const [searchQuery, setSearchQuery] = useState('');

    // Domain hooks
    const {
        data: empresasData,
        isLoading,
        error,
        refetch
    } = useEmpresasList({
        filters: {
            ...(searchQuery && { nome: { contains: searchQuery } })
        }
    });

    const createMutation = useCreateEmpresa();
    const updateMutation = useUpdateEmpresa();

    // Extract empresas array from paginated response
    const empresas = empresasData?.data || [];

    // Calculate statistics
    const totalEmpresas = empresas.length;
    const activeEmpresas = empresas.filter(e => e.status === 'Ativa').length;

    // Toast state
    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error';
        isVisible: boolean;
    }>({
        message: '',
        type: 'success',
        isVisible: false,
    });

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type, isVisible: true });
    }, []);

    const closeToast = useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, []);

    // Modal handlers
    const openCreateModal = useCallback(() => {
        setSelectedEmpresa(null);
        setIsCreateModalOpen(true);
    }, []);

    const openEditModal = useCallback((empresa: Empresa) => {
        setSelectedEmpresa(empresa);
        setIsEditModalOpen(true);
    }, []);

    const closeAllModals = useCallback(() => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedEmpresa(null);
    }, []);

    // Action handlers
    const handleCreate = useCallback(async (data: EmpresaFormData) => {
        // Validar se já existe uma Matriz
        if (data.tipo === 'Matriz') {
            const hasMatriz = empresas.some((e: any) => e.tipo === 'Matriz');
            if (hasMatriz) {
                showWarning('Já existe uma Matriz cadastrada. Só pode existir uma Matriz.');
                return;
            }
        }

        try {
            await createMutation.mutateAsync(data);
            await refetch();
            showSuccess('Empresa criada com sucesso!');
            closeAllModals();
        } catch (error) {
            console.error('Error creating empresa:', error);
            showWarning('Erro ao criar empresa. Tente novamente.');
        }
    }, [createMutation, closeAllModals, refetch, empresas]);

    const handleUpdate = useCallback(async (data: EmpresaFormData) => {
        if (!selectedEmpresa?.id) return;

        try {
            await updateMutation.mutateAsync({
                id: selectedEmpresa.id,
                data
            });
            showSuccess('Empresa atualizada com sucesso!');
            closeAllModals();
        } catch (error) {
            console.error('Error updating empresa:', error);
            showWarning('Erro ao atualizar empresa. Tente novamente.');
        }
    }, [updateMutation, selectedEmpresa, closeAllModals]);

    // DataTable columns configuration
    const columns: DataTableColumn<Empresa>[] = [
        {
            key: 'nome',
            label: 'Empresa',
            align: 'left',
            render: (value, row) => {
                const color = getCompanyColor(row.id);
                return (
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${color.bg} ${color.darkBg} ${color.text} ${color.darkText} ${color.border} ${color.darkBorder}`}>
                            {value.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-sm text-slate-900 dark:text-white font-medium">{value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                ID: #{row.id.substring(0, 4).toUpperCase()}
                            </p>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'tipo',
            label: 'Tipo',
            align: 'left',
            render: (value) => (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Icon
                        name={
                            value === 'Fornecedor' ? 'local_shipping' :
                                value === 'Filial' ? 'storefront' : 'domain'
                        }
                        className="!text-base text-slate-400"
                    />
                    <span>{value}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            align: 'left',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <span
                        className={`h-2 w-2 rounded-full ${value === 'Ativa' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                        title={value}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{value}</span>
                </div>
            )
        }
    ];

    // DataTable actions configuration
    const actions: DataTableAction<Empresa>[] = [
        {
            key: 'edit',
            label: 'Editar',
            icon: 'edit',
            onClick: (row) => openEditModal(row)
        }
    ];

    // Search handler
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    // Metrics for page header
    const metrics = [
        {
            label: 'Total',
            value: totalEmpresas.toString(),
            icon: 'domain',
            color: 'text-white',
            bg: 'bg-slate-900 dark:bg-primary'
        },
        {
            label: 'Ativas',
            value: activeEmpresas.toString(),
            icon: 'check_circle',
            color: 'text-white',
            bg: 'bg-slate-900 dark:bg-primary'
        }
    ];

    const isAnyModalOpen = isCreateModalOpen || isEditModalOpen;

    return (
        <div className="h-full flex flex-col px-4 md:px-6 py-4 overflow-hidden relative">
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={closeToast}
            />

            {/* Page Header */}
            <div className="flex-none flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4 md:mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Gerenciar Empresas</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Supervisione laboratórios parceiros, fornecedores e clínicas.</p>
                </div>
                <div className="w-full lg:w-auto flex flex-wrap items-center gap-3 md:gap-4">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap"
                    >
                        <Icon name="add" className="!text-lg" />
                        <span>Nova Empresa</span>
                    </button>
                    {metrics.map(metric => (
                        <div
                            key={metric.label}
                            className="bg-white dark:bg-surface-dark rounded-2xl p-3 px-4 shadow-soft flex flex-col md:flex-row items-center md:gap-3 border border-slate-100 dark:border-slate-700 justify-center md:justify-start text-center md:text-left hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full ${metric.bg} ${metric.color} flex items-center justify-center mb-1 md:mb-0 shadow-md`}>
                                <Icon name={metric.icon} className="!text-lg md:!text-xl" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">{metric.label}</p>
                                <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{metric.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white dark:bg-surface-dark rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                {/* Data Table */}
                <div className="flex-1 px-6 overflow-y-auto">
                    {isLoading ? (
                        <FeedbackState
                            type="loading"
                            variant="full"
                            size="lg"
                        />
                    ) : error ? (
                        <FeedbackState
                            type="error"
                            title="Erro ao carregar empresas"
                            description={error.message || 'Ocorreu um erro ao buscar as empresas. Tente novamente.'}
                            onRetry={refetch}
                            variant="full"
                            size="lg"
                        />
                    ) : empresas.length === 0 ? (
                        <FeedbackState
                            type="empty"
                            title="Nenhuma empresa encontrada"
                            description="Não há empresas cadastradas no momento. Clique em 'Nova Empresa' para adicionar a primeira."
                            icon="domain_disabled"
                            variant="full"
                            size="lg"
                            action={{
                                label: 'Nova Empresa',
                                onClick: openCreateModal,
                                icon: 'add'
                            }}
                        />
                    ) : (
                        <DataTable
                            data={empresas as any[]}
                            columns={columns}
                            actions={actions}
                            ariaLabel="Empresas"
                            testId="empresas-table"
                            responsive={false}
                        />
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isAnyModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <FormLayout
                            title={isEditModalOpen ? 'Editar Empresa' : 'Nova Empresa'}
                            description={isEditModalOpen
                                ? 'Edite as informações da empresa abaixo.'
                                : 'Preencha as informações para criar uma nova empresa.'
                            }
                            onSubmit={() => {
                                const form = document.querySelector('form') as HTMLFormElement;
                                if (form) {
                                    const formData = new FormData(form);
                                    const data: EmpresaFormData = {
                                        nome: formData.get('nome') as string,
                                        tipo: formData.get('tipo') as 'Matriz' | 'Filial' | 'Fornecedor',
                                        status: formData.get('status') as 'Ativa' | 'Inativa'
                                    };
                                    if (isEditModalOpen) {
                                        handleUpdate(data);
                                    } else {
                                        handleCreate(data);
                                    }
                                }
                            }}
                            onCancel={closeAllModals}
                            submitText={isEditModalOpen ? 'Salvar Alterações' : 'Criar Empresa'}
                            submitLoading={createMutation.isPending || updateMutation.isPending}
                            className="p-6"
                        >
                            <div className="space-y-4">
                                {/* Nome da Empresa */}
                                <FormLayout.Field
                                    name="nome"
                                    label="Nome da Empresa *"
                                    required
                                >
                                    <Input
                                        name="nome"
                                        defaultValue={selectedEmpresa?.nome || ''}
                                        placeholder="Ex: LensTech Soluções"
                                        required
                                    />
                                </FormLayout.Field>

                                {/* Tipo */}
                                <FormLayout.Field
                                    name="tipo"
                                    label="Tipo *"
                                    required
                                >
                                    <select
                                        name="tipo"
                                        defaultValue={selectedEmpresa?.tipo || 'Fornecedor'}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        required
                                    >
                                        <option value="Fornecedor">Fornecedor</option>
                                        <option value="Filial">Filial</option>
                                        <option value="Matriz">Matriz</option>
                                    </select>
                                </FormLayout.Field>

                                {/* Status */}
                                <FormLayout.Field
                                    name="status"
                                    label="Status *"
                                    required
                                >
                                    <select
                                        name="status"
                                        defaultValue={selectedEmpresa?.status || 'Ativa'}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        required
                                    >
                                        <option value="Ativa">Ativa</option>
                                        <option value="Inativa">Inativa</option>
                                    </select>
                                </FormLayout.Field>

                            </div>
                        </FormLayout>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;
