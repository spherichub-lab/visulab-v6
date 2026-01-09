/**
 * Frontend domain types for VisuLab application
 * These types represent the business entities used in the frontend
 */

import React from 'react';

// Re-export backend entity types with frontend-specific extensions
export type {
    BaseEntity,
    SoftDeletableEntity,
    Empresa,
    Usuario,
    Falta,
    Compra,
    Indice,
    Tipo,
    Tratamiento,
    Tratamiento as Tratamento, // Alias for Portuguese consistency
    UsuarioWithRelations,
    FaltaWithRelations,
    TABLE_NAMES,
    TableName,
} from '../../../lib/types/database/entities.types';

// Frontend-specific entity extensions

// Empresa with frontend-specific properties
export interface EmpresaWithStats extends Empresa {
    // Statistics
    totalUsuarios?: number;
    totalFaltas?: number;
    ultimaAtividade?: string;

    // UI state
    isSelected?: boolean;
    isExpanded?: boolean;
}

// Usuario with frontend-specific properties
export interface UsuarioWithStats extends Usuario {
    // Statistics
    totalFaltas?: number;
    ultimaAtividade?: string;

    // UI state
    isSelected?: boolean;
    isOnline?: boolean;

    // Permissions (computed from role)
    permissions?: string[];
}

// Falta with frontend-specific properties
export interface FaltaWithUI extends Falta {
    // Related data (populated from relations)
    usuario?: Usuario;
    empresa?: Empresa;
    tipo?: Tipo;
    indice?: Indice;
    tratamento?: Tratamiento; // Frontend uses 'tratamento' (PT-BR), DB table is 'tratamientos' (ES)

    // UI state
    isSelected?: boolean;
    isEditing?: boolean;
    isValid?: boolean;

    // Computed properties
    status?: 'Pendente' | 'Em Andamento' | 'Resolvida' | 'Cancelada';
    prioridade?: 'Baixa' | 'Média' | 'Alta';
}

// Compra with frontend-specific properties
export interface CompraWithUI extends Compra {
    // UI state
    isSelected?: boolean;
    isEditing?: boolean;

    // Computed properties
    statusFormatted?: string;
    valorFormatted?: string;
    dataFormatted?: string;
}

// Form types for create/update operations

// Empresa form types
export interface EmpresaFormData {
    nome: string;
    tipo?: string;
    contato_nome?: string;
    contato_email?: string;
    status: 'Ativa' | 'Inativa';
}

export interface EmpresaFilters {
    nome?: string;
    tipo?: string;
    status?: string;
    contato_email?: string;
    created_at?: {
        from?: string;
        to?: string;
    };
}

// Usuario form types
export interface UsuarioFormData {
    nome: string;
    email: string;
    empresa_id?: string;
    role: 'Administrador' | 'Usuário';
    status: 'Active' | 'Offline' | 'Pending' | 'Inactive';
    avatar_url?: string;
}

export interface UsuarioFilters {
    nome?: string;
    email?: string;
    empresa_id?: string;
    role?: string;
    status?: string;
    created_at?: {
        from?: string;
        to?: string;
    };
}

// Falta form types
export interface FaltaFormData {
    usuario_id: string;
    empresa_id: string;
    tipo_id: string;
    indice_id: string;
    tratamento_id?: string;
    esf?: number;
    cil?: number;
    quantidade?: number;
}

export interface FaltaFilters {
    usuario_id?: string;
    empresa_id?: string;
    tipo_id?: string;
    indice_id?: string;
    tratamento_id?: string;
    status?: string;
    created_at?: {
        from?: string;
        to?: string;
    };
}

// Compra form types
export interface CompraFormData {
    fornecedor: string;
    data_compra: string;
    valor_total: number;
    status: 'Pendente' | 'Pago' | 'Cancelado';
    descricao?: string;
}

export interface CompraFilters {
    fornecedor?: string;
    status?: string;
    valor_total?: {
        min?: number;
        max?: number;
    };
    data_compra?: {
        from?: string;
        to?: string;
    };
}

// Dashboard types
export interface DashboardStats {
    totalEmpresas: number;
    totalUsuarios: number;
    totalFaltas: number;
    totalCompras: number;
    empresasAtivas: number;
    usuariosOnline: number;
    faltasPendentes: number;
    comprasPendentes: number;
}

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface TimeSeriesDataPoint {
    date: string;
    value: number;
    label?: string;
}

export interface DashboardData {
    stats: DashboardStats;
    faltasPorStatus: ChartDataPoint[];
    faltasPorTipo: ChartDataPoint[];
    faltasPorEmpresa: ChartDataPoint[];
    faltasPorMes: TimeSeriesDataPoint[];
    comprasPorStatus: ChartDataPoint[];
    comprasPorMes: TimeSeriesDataPoint[];
}

// UI state types
export interface UIState {
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark' | 'system';
    language: 'pt-BR' | 'en';
    notifications: Notification[];
    modals: Record<string, boolean>;
    loading: Record<string, boolean>;
}

// Notification types
export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    timestamp: number;
    read: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// Modal types
export interface ModalState {
    [key: string]: {
        isOpen: boolean;
        data?: any;
        title?: string;
        size?: 'sm' | 'md' | 'lg' | 'xl';
    };
}

// Table state types
export interface TableState<T> {
    data: T[];
    loading: boolean;
    error?: string;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    sorting: {
        column: keyof T;
        direction: 'asc' | 'desc';
    };
    filtering: Record<string, any>;
    selection: string[];
}

// Form state types
export interface FormState<T> {
    data: T;
    errors: Record<keyof T, string>;
    touched: Record<keyof T, boolean>;
    isValid: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
}

// Search state types
export interface SearchState {
    query: string;
    results: any[];
    loading: boolean;
    error?: string;
    suggestions: string[];
}

// Permission types
export type Permission =
    | 'empresas.read'
    | 'empresas.write'
    | 'usuarios.read'
    | 'usuarios.write'
    | 'faltas.read'
    | 'faltas.write'
    | 'compras.read'
    | 'compras.write'
    | 'dashboard.read'
    | 'admin.system';

export type Role = 'Administrador' | 'Usuário';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    Administrador: [
        'empresas.read',
        'empresas.write',
        'usuarios.read',
        'usuarios.write',
        'faltas.read',
        'faltas.write',
        'compras.read',
        'compras.write',
        'dashboard.read',
        'admin.system',
    ],
    'Usuário': [
        'empresas.read',
        'usuarios.read',
        'faltas.read',
        'faltas.write',
        'compras.read',
        'compras.write',
        'dashboard.read',
    ],
};

// Export/Import types
export interface ExportOptions {
    format: 'csv' | 'xlsx' | 'pdf';
    filters?: any;
    columns?: string[];
    includeHeaders?: boolean;
}

export interface ImportResult {
    success: boolean;
    imported: number;
    errors: string[];
    warnings: string[];
}

// Validation types
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
}

export type ValidationSchema<T> = {
    [K in keyof T]?: ValidationRule | ValidationRule[];
};

// Component prop types
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
    testId?: string;
}

export interface ButtonProps extends BaseComponentProps {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
    type?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
