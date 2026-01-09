/**
 * Business logic types for VisuLab application
 * These types define business rules, workflows, and domain-specific concepts
 */

import { Empresa, Usuario, Falta, Compra, Indice, Tipo, Tratamento } from '../database/entities.types';

// User roles and permissions
export enum UserRole {
    ADMINISTRADOR = 'Administrador',
    USUARIO = 'Usuário'
}

export enum Permission {
    READ_EMPRESAS = 'read_empresas',
    WRITE_EMPRESAS = 'write_empresas',
    READ_USUARIOS = 'read_usuarios',
    WRITE_USUARIOS = 'write_usuarios',
    READ_FALTAS = 'read_faltas',
    WRITE_FALTAS = 'write_faltas',
    READ_COMPRAS = 'read_compras',
    WRITE_COMPRAS = 'write_compras',
    READ_REFERENCE_DATA = 'read_reference_data',
    WRITE_REFERENCE_DATA = 'write_reference_data',
    MANAGE_CACHE = 'manage_cache'
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.ADMINISTRADOR]: [
        Permission.READ_EMPRESAS,
        Permission.WRITE_EMPRESAS,
        Permission.READ_USUARIOS,
        Permission.WRITE_USUARIOS,
        Permission.READ_FALTAS,
        Permission.WRITE_FALTAS,
        Permission.READ_COMPRAS,
        Permission.WRITE_COMPRAS,
        Permission.READ_REFERENCE_DATA,
        Permission.WRITE_REFERENCE_DATA,
        Permission.MANAGE_CACHE
    ],
    [UserRole.USUARIO]: [
        Permission.READ_EMPRESAS,
        Permission.READ_USUARIOS,
        Permission.READ_FALTAS,
        Permission.WRITE_FALTAS,
        Permission.READ_COMPRAS,
        Permission.READ_REFERENCE_DATA
    ]
};

// Entity status enums
export enum EmpresaStatus {
    ATIVA = 'Ativa',
    INATIVA = 'Inativa'
}

export enum UsuarioStatus {
    ACTIVE = 'Active',
    OFFLINE = 'Offline',
    PENDING = 'Pending',
    INACTIVE = 'Inactive'
}

export enum CompraStatus {
    PENDENTE = 'Pendente',
    PAGO = 'Pago',
    CANCELADO = 'Cancelado'
}

// Business rules and validation
export interface BusinessRule {
    name: string;
    description: string;
    validate: (context: any) => boolean;
    errorMessage: string;
}

// Workflow types
export interface WorkflowStep<T = any> {
    id: string;
    name: string;
    description: string;
    execute: (context: T) => Promise<WorkflowResult<T>>;
    rollback?: (context: T) => Promise<void>;
    requiredPermissions?: Permission[];
}

export interface WorkflowResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    nextStepId?: string;
}

export interface Workflow<T = any> {
    id: string;
    name: string;
    description: string;
    initialStepId: string;
    steps: Map<string, WorkflowStep<T>>;
}

// Domain events
export interface DomainEvent {
    id: string;
    type: string;
    aggregateId: string;
    aggregateType: string;
    data: any;
    timestamp: Date;
    version: number;
}

// Aggregate roots
export interface AggregateRoot {
    id: string;
    version: number;
    uncommittedEvents: DomainEvent[];
    markEventsAsCommitted(): void;
    applyEvent(event: DomainEvent): void;
}

// Value objects
export interface Email {
    value: string;
    isValid(): boolean;
}

export interface Money {
    amount: number;
    currency: string;
    add(other: Money): Money;
    subtract(other: Money): Money;
}

// Specification pattern
export interface Specification<T> {
    isSatisfiedBy(candidate: T): boolean;
    and(other: Specification<T>): Specification<T>;
    or(other: Specification<T>): Specification<T>;
    not(): Specification<T>;
}

// Repository specifications
export interface EmpresaSpecification extends Specification<Empresa> { }
export interface UsuarioSpecification extends Specification<Usuario> { }
export interface FaltaSpecification extends Specification<Falta> { }
export interface CompraSpecification extends Specification<Compra> { }

// Business operations
export interface CreateFaltaOperation {
    empresaId: string;
    usuarioId: string;
    tipoId: string;
    indiceId: string;
    tratamentoId?: string;
    esf?: number;
    cil?: number;
    quantidade?: number;
    validate(): Promise<boolean>;
    execute(): Promise<Falta>;
}

export interface CreateCompraOperation {
    fornecedor: string;
    dataCompra: Date;
    valorTotal: Money;
    status: CompraStatus;
    descricao?: string;
    validate(): Promise<boolean>;
    execute(): Promise<Compra>;
}

// Reporting types
export interface ReportFilter {
    startDate?: Date;
    endDate?: Date;
    empresaId?: string;
    usuarioId?: string;
    status?: string;
}

export interface ReportData {
    total: number;
    items: any[];
    summary: Record<string, any>;
}

// Cache configuration
export interface CacheConfig {
    ttl: number; // Time to live in seconds
    maxSize: number; // Maximum number of items
    strategy: 'lru' | 'fifo' | 'lfu';
}

// Reference data cache keys
export const REFERENCE_CACHE_KEYS = {
    INDICES: 'indices:all',
    TIPOS: 'tipos:all',
    TRATAMENTOS: 'tratamentos:all'
} as const;

// Business metrics
export interface BusinessMetrics {
    totalFaltas: number;
    totalCompras: number;
    totalUsuarios: number;
    totalEmpresas: number;
    comprasByStatus: Record<CompraStatus, number>;
    usuariosByRole: Record<UserRole, number>;
}

// Audit trail
export interface AuditEntry {
    id: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}