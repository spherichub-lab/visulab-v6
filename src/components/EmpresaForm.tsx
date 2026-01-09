/**
 * EmpresaForm - Reusable form component for creating/editing empresas
 * Uses useEmpresaForm hook for state management and validation
 */

import React from 'react';
import { Icon } from '../../components/Icon';
import { CustomSelect } from '../../components/CustomSelect';
import { useEmpresaForm, UseEmpresaFormOptions } from '../hooks/ui/useEmpresaForm';

interface EmpresaFormProps {
    initialData?: Partial<any>;
    onSubmit: (data: any) => Promise<void>;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    mode?: 'create' | 'edit';
    existingEmpresas?: any[];
}

export const EmpresaForm: React.FC<EmpresaFormProps> = ({
    initialData,
    onSubmit,
    onSuccess,
    onError,
    mode = 'create',
    existingEmpresas = []
}) => {
    const formOptions: UseEmpresaFormOptions = {
        initialData,
        onSubmit,
        onSuccess,
        onError,
        existingEmpresas,
        isEditing: mode === 'edit'
    };

    const {
        formData,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        getFieldError,
        hasFieldError
    } = useEmpresaForm(formOptions);

    const tipoOptions = ['Fornecedor', 'Filial', 'Matriz'];
    const statusOptions = [
        { value: 'Ativa', label: 'Ativa' },
        { value: 'Inativa', label: 'Inativa' }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome da Empresa */}
            <div>
                <label htmlFor="nome" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Nome da Empresa *
                </label>
                <input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    onBlur={() => handleBlur('nome')}
                    placeholder="Ex: LensTech Soluções"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${hasFieldError('nome')
                        ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                        : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900'
                        } text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary`}
                    disabled={isSubmitting}
                />
                {hasFieldError('nome') && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Icon name="error_outline" className="!text-sm" />
                        {getFieldError('nome')}
                    </p>
                )}
            </div>

            {/* Tipo e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        Tipo *
                    </label>
                    <CustomSelect
                        value={formData.tipo || ''}
                        onChange={(value) => handleChange('tipo', value)}
                        options={tipoOptions}
                        placeholder="Selecione o tipo"
                        disabled={isSubmitting}
                        className={hasFieldError('tipo') ? 'border-red-300 dark:border-red-600' : ''}
                    />
                    {hasFieldError('tipo') && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Icon name="error_outline" className="!text-sm" />
                            {getFieldError('tipo')}
                        </p>
                    )}
                </div>

                {/* Status */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        Status *
                    </label>
                    <button
                        type="button"
                        onClick={() => handleChange('status', formData.status === 'Ativa' ? 'Inativa' : 'Ativa')}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between border ${formData.status === 'Ativa'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-600'
                            } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        <span>{formData.status === 'Ativa' ? 'Ativa' : 'Inativa'}</span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.status === 'Ativa' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}>
                            <div className={`absolute top-1 bottom-1 w-3 h-3 bg-white rounded-full transition-all ${formData.status === 'Ativa' ? 'left-[22px]' : 'left-1'
                                }`}></div>
                        </div>
                    </button>
                    {hasFieldError('status') && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Icon name="error_outline" className="!text-sm" />
                            {getFieldError('status')}
                        </p>
                    )}
                </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-4">
                {/* Nome do Contato */}
                <div>
                    <label htmlFor="contato_nome" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        Nome do Contato
                    </label>
                    <input
                        id="contato_nome"
                        type="text"
                        value={formData.contato_nome || ''}
                        onChange={(e) => handleChange('contato_nome', e.target.value)}
                        onBlur={() => handleBlur('contato_nome')}
                        placeholder="Ex: João Silva"
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${hasFieldError('contato_nome')
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                            : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900'
                            } text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary`}
                        disabled={isSubmitting}
                    />
                    {hasFieldError('contato_nome') && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Icon name="error_outline" className="!text-sm" />
                            {getFieldError('contato_nome')}
                        </p>
                    )}
                </div>

                {/* Email do Contato */}
                <div>
                    <label htmlFor="contato_email" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        Email do Contato
                    </label>
                    <input
                        id="contato_email"
                        type="email"
                        value={formData.contato_email || ''}
                        onChange={(e) => handleChange('contato_email', e.target.value)}
                        onBlur={() => handleBlur('contato_email')}
                        placeholder="Ex: joao@empresa.com"
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${hasFieldError('contato_email')
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                            : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900'
                            } text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary`}
                        disabled={isSubmitting}
                    />
                    {hasFieldError('contato_email') && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Icon name="error_outline" className="!text-sm" />
                            {getFieldError('contato_email')}
                        </p>
                    )}
                </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex flex-col sm:flex-row-reverse gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="btn-submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {mode === 'edit' ? 'Salvando...' : 'Criando...'}
                        </>
                    ) : (
                        <>
                            <Icon name={mode === 'edit' ? 'save' : 'add'} className="!text-lg" />
                            {mode === 'edit' ? 'Salvar Alterações' : 'Criar Empresa'}
                        </>
                    )}
                </button>

                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => window.history.back()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-bold shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default EmpresaForm;