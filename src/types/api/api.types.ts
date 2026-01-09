/**
 * Frontend API types for VisuLab application
 * These types define request/response structures and API contracts for the frontend
 */

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

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request configuration
export interface RequestConfig {
    method?: HttpMethod;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
    retries?: number;
}

// API client configuration
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
    authHeader?: string;
}

// Authentication types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    company?: string;
    role: 'Administrador' | 'Usuário';
    avatarUrl?: string;
    empresa_id?: string;
    auth_user_id?: string;
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

// Entity types (will be imported from backend types)
export interface Entity {
    id: string;
    created_at?: string;
    updated_at?: string;
}

// Error codes
export enum ErrorCode {
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
    SERVER_ERROR = 'SERVER_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Request interceptor type
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

// Response interceptor type
export type ResponseInterceptor<T = any> = (
    response: ApiResponse<T>
) => ApiResponse<T> | Promise<ApiResponse<T>>;

// Error interceptor type
export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;