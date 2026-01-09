/**
 * Core database entity types for VisuLab application
 * 
 * DEPRECATED: This file now re-exports types from generated.ts
 * All types are now auto-generated from Supabase schema
 * 
 * @deprecated Import directly from './generated.ts' instead
 */

// Re-export all generated types for backward compatibility
export type Json = import('./generated').Json;
export type Database = import('./generated').Database;

// Entity types (Row types from generated)
export type Empresa = import('./generated').Empresa;
export type EmpresaInsert = import('./generated').EmpresaInsert;
export type EmpresaUpdate = import('./generated').EmpresaUpdate;

export type Usuario = import('./generated').Usuario;
export type UsuarioInsert = import('./generated').UsuarioInsert;
export type UsuarioUpdate = import('./generated').UsuarioUpdate;

export type Falta = import('./generated').Falta;
export type FaltaInsert = import('./generated').FaltaInsert;
export type FaltaUpdate = import('./generated').FaltaUpdate;

export type Compra = import('./generated').Compra;
export type CompraInsert = import('./generated').CompraInsert;
export type CompraUpdate = import('./generated').CompraUpdate;

export type Indice = import('./generated').Indice;
export type IndiceInsert = import('./generated').IndiceInsert;
export type IndiceUpdate = import('./generated').IndiceUpdate;

export type Tipo = import('./generated').Tipo;
export type TipoInsert = import('./generated').TipoInsert;
export type TipoUpdate = import('./generated').TipoUpdate;

export type Tratamiento = import('./generated').Tratamiento;
export type TratamientoInsert = import('./generated').TratamientoInsert;
export type TratamientoUpdate = import('./generated').TratamientoUpdate;

// Legacy interfaces for backward compatibility
// These will be removed in future versions
export interface BaseEntity {
    id: string;
    created_at?: string;
    updated_at?: string;
}

export interface SoftDeletableEntity extends BaseEntity {
    deleted_at?: string | null;
}

// Entity types with joined relationships
export interface UsuarioWithRelations extends Usuario {
    empresas?: Empresa;
}

export interface FaltaWithRelations extends Falta {
    usuarios?: Usuario;
    empresas?: Empresa;
    tipos?: Tipo;
    indices?: Indice;
    tratamientos?: Tratamiento; // DB table name (Spanish) - frontend uses 'tratamento' (Portuguese)
}

// Database table names
export const TABLE_NAMES = {
    EMPRESAS: 'empresas',
    USUARIOS: 'usuarios',
    FALTAS: 'faltas',
    COMPRAS: 'compras',
    INDICES: 'indices',
    TIPOS: 'tipos',
    TRATAMENTOS: 'tratamentos' // DB table name is 'tratamentos' (Portuguese)
} as const;

export type TableName = typeof TABLE_NAMES[keyof typeof TABLE_NAMES];
