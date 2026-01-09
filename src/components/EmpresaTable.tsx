/**
 * EmpresaTable - Table component for displaying empresas list
 * Includes loading states, empty states, and error handling
 */

import React from 'react';
import { Icon } from '../../components/Icon';

// Types
interface Empresa {
    id: string;
    nome: string;
    tipo: 'Matriz' | 'Filial' | 'Fornecedor';
    status: 'Ativa' | 'Inativa';
    contato_nome?: string;
    contato_email?: string;
    created_at?: string;
}

interface EmpresaTableProps {
    empresas: Empresa[];
    isLoading: boolean;
    error?: Error | null;
    onEdit: (empresa: Empresa) => void;
    onDelete: (empresa: Empresa) => void;
    onToggleStatus: (empresa: Empresa) => void;
    selectedIds: string[];
    onSelectAll: (checked: boolean) => void;
    onSelectOne: (id: string, checked: boolean) => void;
}

// Helper functions
const getCompanyTypeIcon = (tipo: string) => {
    switch (tipo) {
        case 'Fornecedor': return 'local_shipping';
        case 'Filial': return 'storefront';
        case 'Matriz': return 'domain';
        default: return 'domain';
    }
};

const getCompanyInitials = (nome: string) => {
    return nome.substring(0, 2).toUpperCase();
};

const getCompanyColorClass = (tipo: string) => {
    switch (tipo) {
        case 'Fornecedor': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        case 'Filial': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        case 'Matriz': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
        default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    }
};

// Loading skeleton component
const TableSkeleton = () => (
    <div className="animate-pulse">
        {[...Array(5)].map((_, index) => (
            <tr key={index} className="border-b border-slate-50 dark:border-slate-700">
                <td className="px-6 py-4">
                    <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="h-2.5 w-2.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto"></div>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    </div>
                </td>
            </tr>
        ))}
    </div>
);

// Empty state component
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
            <Icon name="domain_disabled" className="!text-3xl text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Nenhuma empresa encontrada
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
            Não há empresas cadastradas no momento. Clique em "Nova Empresa" para adicionar a primeira.
        </p>
    </div>
);

// Error state component
const ErrorState = ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="h-20 w-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-100 dark:border-red-900/30">
            <Icon name="error" className="!text-3xl text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Erro ao carregar empresas
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
            {error.message || 'Ocorreu um erro ao buscar as empresas. Tente novamente.'}
        </p>
        <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
            <Icon name="refresh" className="!text-lg" />
            Tentar Novamente
        </button>
    </div>
);

// Main table component
export const EmpresaTable: React.FC<EmpresaTableProps> = ({
    empresas,
    isLoading,
    error,
    onEdit,
    onDelete,
    onToggleStatus,
    selectedIds,
    onSelectAll,
    onSelectOne
}) => {
    const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectAll(e.target.checked);
    };

    const handleSelectOneChange = (id: string, checked: boolean) => {
        onSelectOne(id, checked);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative pb-10">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-white dark:bg-surface-dark z-10 shadow-sm">
                        <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-bold w-[60px]">
                                <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </th>
                            <th className="px-6 py-4 font-bold">Empresa</th>
                            <th className="px-6 py-4 font-bold">Tipo</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                            <th className="px-6 py-4 font-bold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                        <TableSkeleton />
                    </tbody>
                </table>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <ErrorState
                error={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    // Show empty state
    if (empresas.length === 0) {
        return <EmptyState />;
    }

    // Show table with data
    return (
        <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative pb-10">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 bg-white dark:bg-surface-dark z-10 shadow-sm">
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-bold w-[60px]">
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-primary focus:ring-primary/20"
                                checked={empresas.length > 0 && selectedIds.length === empresas.length}
                                onChange={handleSelectAllChange}
                            />
                        </th>
                        <th className="px-6 py-4 font-bold">Empresa</th>
                        <th className="px-6 py-4 font-bold">Tipo</th>
                        <th className="px-6 py-4 font-bold text-center">Status</th>
                        <th className="px-6 py-4 font-bold text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-sm font-medium">
                    {empresas.map((empresa) => (
                        <tr
                            key={empresa.id}
                            className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0 cursor-pointer"
                        >
                            <td className="px-6 py-4">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-primary focus:ring-primary/20"
                                    checked={selectedIds.includes(empresa.id)}
                                    onChange={(e) => handleSelectOneChange(empresa.id, e.target.checked)}
                                />
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full ${getCompanyColorClass(empresa.tipo)} flex items-center justify-center text-sm font-bold shrink-0 border`}>
                                        {getCompanyInitials(empresa.nome)}
                                    </div>
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-bold">{empresa.nome}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            ID: #{empresa.id.substring(0, 4).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Icon name={getCompanyTypeIcon(empresa.tipo)} className="!text-lg text-slate-400" />
                                    <span>{empresa.tipo}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${empresa.status === 'Ativa' ? 'bg-emerald-500' : 'bg-red-500'
                                            }`}
                                        title={empresa.status}
                                    ></span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onEdit(empresa)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary transition-all"
                                        title="Editar"
                                    >
                                        <Icon name="edit" className="!text-lg" />
                                    </button>
                                    <button
                                        onClick={() => onToggleStatus(empresa)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 transition-all"
                                        title={empresa.status === 'Ativa' ? 'Inativar' : 'Ativar'}
                                    >
                                        <Icon name={empresa.status === 'Ativa' ? 'block' : 'check_circle'} className="!text-lg" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(empresa)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-all"
                                        title="Excluir"
                                    >
                                        <Icon name="delete" className="!text-lg" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EmpresaTable;