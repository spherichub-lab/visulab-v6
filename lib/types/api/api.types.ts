/**
 * API-related types for VisuLab application
 * These types define request/response structures and API contracts
 */

import {
    Empresa,
    EmpresaInsert,
    EmpresaUpdate,
    Usuario,
    UsuarioInsert,
    UsuarioUpdate,
    Falta,
    FaltaInsert,
    FaltaUpdate,
    Compra,
    CompraInsert,
    CompraUpdate,
    Indice,
    IndiceInsert,
    IndiceUpdate,
    Tipo,
    TipoInsert,
    TipoUpdate,
    Tratamiento,
    TratamientoInsert,
    TratamientoUpdate
} from '../database/entities.types';

// Generic API response wrapper
export interface ApiResponse<T = any> {
    data?: T;
    error?: ApiError;
    success: boolean;
    message?: string;
}

// API error structure
export interface ApiError {
    code: string;
    message: string;
    details?: any;
    statusCode: number;
}

// Pagination types
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Filter and sort types
export interface FilterParams {
    [key: string]: any;
}

export interface SortParams {
    column: string;
    direction: 'asc' | 'desc';
}

// Query options
export interface QueryOptions extends PaginationParams {
    filters?: FilterParams;
    sort?: SortParams;
    select?: string;
}

// Entity-specific request/response types

// Empresa types
export type CreateEmpresaRequest = Omit<EmpresaInsert, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export type UpdateEmpresaRequest = Partial<CreateEmpresaRequest> & { id: string };

export type EmpresaResponse = Empresa;

// Usuario types
export type CreateUsuarioRequest = Omit<UsuarioInsert, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export type UpdateUsuarioRequest = Partial<CreateUsuarioRequest> & { id: string };

export type UsuarioResponse = Usuario;

// Falta types
export interface CreateFaltaRequest {
    usuario_id: string;
    empresa_id: string;
    tipo_id: string;
    indice_id: string;
    tratamento_id?: string;
    esf?: number;
    cil?: number;
    quantidade?: number;
}

export interface UpdateFaltaRequest extends Partial<CreateFaltaRequest> {
    id: string;
}

export interface FaltaResponse extends Falta { }

// Compra types
export type CreateCompraRequest = Omit<CompraInsert, 'id' | 'created_at' | 'updated_at'>;

export type UpdateCompraRequest = Partial<CreateCompraRequest> & { id: string };

export type CompraResponse = Compra;

// Reference data types
export type CreateIndiceRequest = Omit<IndiceInsert, 'id' | 'created_at' | 'updated_at'>;

export type UpdateIndiceRequest = Partial<CreateIndiceRequest> & { id: string };

export type IndiceResponse = Indice;

export type CreateTipoRequest = Omit<TipoInsert, 'id' | 'created_at' | 'updated_at'>;

export type UpdateTipoRequest = Partial<CreateTipoRequest> & { id: string };

export type TipoResponse = Tipo;

export type CreateTratamentoRequest = Omit<TratamientoInsert, 'id' | 'created_at' | 'updated_at'>;

export type UpdateTratamentoRequest = Partial<CreateTratamentoRequest> & { id: string };

export type TratamentoResponse = Tratamiento;

// Authentication types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: Usuario;
    session: {
        access_token: string;
        refresh_token: string;
        expires_at: number;
    };
}

export interface RegisterRequest {
    nome: string;
    email: string;
    password: string;
    empresa_id?: string;
}

// Cache invalidation types
export interface CacheInvalidationRequest {
    keys: string[];
}

export interface CacheInvalidationResponse {
    success: boolean;
    invalidated: string[];
}