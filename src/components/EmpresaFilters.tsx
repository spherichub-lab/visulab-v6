/**
 * EmpresaFilters - Filter component for empresas list
 * Provides search, filtering and sorting options
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../../components/Icon';
import { CustomSelect } from '../../components/CustomSelect';
import type { EmpresaFilters } from '../types/domain/domain.types';

interface EmpresaFiltersProps {
    filters: EmpresaFilters;
    onFiltersChange: (filters: EmpresaFilters) => void;
    onSearch: (query: string) => void;
    isLoading?: boolean;
}

const DEBOUNCE_DELAY = 300;

export const EmpresaFiltersComponent: React.FC<EmpresaFiltersProps> = ({
    filters,
    onFiltersChange,
    onSearch,
    isLoading = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [localFilters, setLocalFilters] = useState<EmpresaFilters>(filters);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(searchQuery);
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(timer);
    }, [searchQuery, onSearch]);

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleFilterChange = useCallback((key: keyof EmpresaFilters, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    }, [localFilters, onFiltersChange]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    const clearFilters = useCallback(() => {
        const emptyFilters: EmpresaFilters = {};
        setLocalFilters(emptyFilters);
        setSearchQuery('');
        onFiltersChange(emptyFilters);
        onSearch('');
    }, [onFiltersChange, onSearch]);

    const hasActiveFilters = Object.values(localFilters).some(value =>
        value !== undefined && value !== '' && value !== null
    ) || searchQuery.length > 0;

    const tipoOptions = [
        { value: '', label: 'Todos os tipos' },
        { value: 'Fornecedor', label: 'Fornecedor' },
        { value: 'Filial', label: 'Filial' },
        { value: 'Matriz', label: 'Matriz' }
    ];

    const statusOptions = [
        { value: '', label: 'Todos os status' },
        { value: 'Ativa', label: 'Ativa' },
        { value: 'Inativa', label: 'Inativa' }
    ];

    return (
        <div className="flex-none flex flex-col lg:flex-row justify-between items-center p-4 md:p-6 gap-4 border-b border-slate-50 dark:border-slate-700">
            {/* Search Input */}
            <div className="relative w-full lg:w-96 group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Icon name="search" />
                </span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Buscar por nome ou email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-base md:text-sm font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                    disabled={isLoading}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <Icon name="close" className="!text-lg" />
                    </button>
                )}
            </div>

            {/* Filters and Actions */}
            <div className="flex gap-3 w-full lg:w-auto">
                {/* Quick Filters */}
                <div className="hidden md:flex items-center gap-2">
                    <CustomSelect
                        value={localFilters.tipo || ''}
                        onChange={(value) => handleFilterChange('tipo', value || undefined)}
                        options={tipoOptions}
                        placeholder="Tipo"
                        icon="business"
                        className="min-w-[140px]"
                        triggerClassName="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600"
                        data-testid="filter-tipo"
                    />

                    <CustomSelect
                        value={localFilters.status || ''}
                        onChange={(value) => handleFilterChange('status', value || undefined)}
                        options={statusOptions}
                        placeholder="Status"
                        icon="toggle_on"
                        className="min-w-[120px]"
                        triggerClassName="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600"
                        data-testid="filter-status"
                    />
                </div>

                {/* Filter Toggle Button (Mobile) */}
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-1 md:flex-none md:hidden">
                    <Icon name="filter_list" className="!text-lg" />
                    <span>Filtros</span>
                    {hasActiveFilters && (
                        <span className="h-2 w-2 bg-primary rounded-full"></span>
                    )}
                </button>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Limpar filtros"
                    >
                        <Icon name="clear" className="!text-lg" />
                        <span className="hidden sm:inline">Limpar</span>
                    </button>
                )}

                {/* Mobile Filters Panel */}
                <div className="md:hidden w-full space-y-3">
                    <CustomSelect
                        value={localFilters.tipo || ''}
                        onChange={(value) => handleFilterChange('tipo', value || undefined)}
                        options={tipoOptions}
                        placeholder="Tipo"
                        icon="business"
                        triggerClassName="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600"
                    />

                    <CustomSelect
                        value={localFilters.status || ''}
                        onChange={(value) => handleFilterChange('status', value || undefined)}
                        options={statusOptions}
                        placeholder="Status"
                        icon="toggle_on"
                        triggerClassName="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600"
                    />
                </div>
            </div>
        </div>
    );
};

export default EmpresaFiltersComponent;