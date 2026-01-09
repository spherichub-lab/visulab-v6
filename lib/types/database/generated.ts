/**
 * Generated Database Types
 * AUTO-GENERATED - DO NOT EDIT MANUALLY
 * 
 * This file contains types generated from Supabase database schema.
 * Regenerate using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public
 * 
 * For now, this file mirrors the existing entities.types.ts structure
 * and will be replaced by actual Supabase CLI generation when available.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            empresas: {
                Row: Empresa
                Insert: EmpresaInsert
                Update: EmpresaUpdate
            }
            usuarios: {
                Row: Usuario
                Insert: UsuarioInsert
                Update: UsuarioUpdate
            }
            faltas: {
                Row: Falta
                Insert: FaltaInsert
                Update: FaltaUpdate
            }
            compras: {
                Row: Compra
                Insert: CompraInsert
                Update: CompraUpdate
            }
            indices: {
                Row: Indice
                Insert: IndiceInsert
                Update: IndiceUpdate
            }
            tipos: {
                Row: Tipo
                Insert: TipoInsert
                Update: TipoUpdate
            }
            tratamientos: {
                Row: Tratamiento
                Insert: TratamientoInsert
                Update: TratamientoUpdate
            }
            tratamentos: {
                Row: Tratamiento
                Insert: TratamientoInsert
                Update: TratamientoUpdate
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: 'admin' | 'user' | 'viewer'
            status: 'Ativa' | 'Inativa'
            usuario_status: 'Active' | 'Offline' | 'Pending' | 'Inactive'
            compra_status: 'Pendente' | 'Pago' | 'Cancelado'
        }
    }
}

// Empresa types
export interface Empresa {
    id: string
    nome: string
    tipo?: string | null
    contato_nome?: string | null
    contato_email?: string | null
    status: Database['public']['Enums']['status']
    created_at?: string | null
    updated_at?: string | null
    deleted_at?: string | null
}

export interface EmpresaInsert {
    id?: string
    nome: string
    tipo?: string | null
    contato_nome?: string | null
    contato_email?: string | null
    status?: Database['public']['Enums']['status']
    created_at?: string | null
    updated_at?: string | null
    deleted_at?: string | null
}

export interface EmpresaUpdate {
    id?: string
    nome?: string
    tipo?: string | null
    contato_nome?: string | null
    contato_email?: string | null
    status?: Database['public']['Enums']['status']
    created_at?: string | null
    updated_at?: string | null
    deleted_at?: string | null
}

// Usuario types
export interface Usuario {
    id: string
    nome: string
    email: string
    empresa_id?: string | null
    role: Database['public']['Enums']['user_role']
    status: Database['public']['Enums']['usuario_status']
    last_active?: string | null
    avatar_url?: string | null
    initials?: string | null
    auth_user_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    deleted_at?: string | null
}

export interface UsuarioInsert {
    id?: string
    nome: string
    email: string
    empresa_id?: string | null
    role?: Database['public']['Enums']['user_role']
    status?: Database['public']['Enums']['usuario_status']
    last_active?: string | null
    avatar_url?: string | null
    initials?: string | null
    auth_user_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    deleted_at?: string | null
}

export interface UsuarioUpdate {
    id?: string
    nome?: string
    email?: string
    empresa_id?: string | null
    role?: Database['public']['Enums']['user_role']
    status?: Database['public']['Enums']['usuario_status']
    last_active?: string | null
    avatar_url?: string | null
    initials?: string | null
    auth_user_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    deleted_at?: string | null
}

// Falta types
export interface Falta {
    id: string
    usuario_id: string
    empresa_id: string
    tipo_id: string
    indice_id: string
    tratamiento_id?: string | null
    esf?: number | null
    cil?: number | null
    quantidade?: number | null
    created_at?: string | null
    updated_at?: string | null
    // Nested relationships from joins
    usuarios?: {
        id: string
        nome: string
        email?: string
    }
    empresas?: {
        id: string
        nome: string
    }
    tipos?: {
        id: string
        nome: string
        cor?: string
    }
    indices?: {
        id: string
        nome: string
    }
    tratamentos?: {
        id: string
        nome: string
    }
}

export interface FaltaInsert {
    id?: string
    usuario_id: string
    empresa_id: string
    tipo_id: string
    indice_id: string
    tratamiento_id?: string | null
    esf?: number | null
    cil?: number | null
    quantidade?: number | null
    created_at?: string | null
    updated_at?: string | null
}

export interface FaltaUpdate {
    id?: string
    usuario_id?: string
    empresa_id?: string
    tipo_id?: string
    indice_id?: string
    tratamiento_id?: string | null
    esf?: number | null
    cil?: number | null
    quantidade?: number | null
    created_at?: string | null
    updated_at?: string | null
}

// Compra types
export interface Compra {
    id: string
    fornecedor: string
    data_compra: string
    valor_total: number
    status: Database['public']['Enums']['compra_status']
    descricao?: string | null
    created_at?: string | null
    updated_at?: string | null
}

export interface CompraInsert {
    id?: string
    fornecedor: string
    data_compra: string
    valor_total: number
    status?: Database['public']['Enums']['compra_status']
    descricao?: string | null
    created_at?: string | null
    updated_at?: string | null
}

export interface CompraUpdate {
    id?: string
    fornecedor?: string
    data_compra?: string
    valor_total?: number
    status?: Database['public']['Enums']['compra_status']
    descricao?: string | null
    created_at?: string | null
    updated_at?: string | null
}

// Indice types
export interface Indice {
    id: string
    nome: string
    created_at?: string | null
    updated_at?: string | null
}

export interface IndiceInsert {
    id?: string
    nome: string
    created_at?: string | null
    updated_at?: string | null
}

export interface IndiceUpdate {
    id?: string
    nome?: string
    created_at?: string | null
    updated_at?: string | null
}

// Tipo types
export interface Tipo {
    id: string
    nome: string
    created_at?: string | null
    updated_at?: string | null
}

export interface TipoInsert {
    id?: string
    nome: string
    created_at?: string | null
    updated_at?: string | null
}

export interface TipoUpdate {
    id?: string
    nome?: string
    created_at?: string | null
    updated_at?: string | null
}

// Tratamiento types
export interface Tratamiento {
    id: string
    nome: string
    created_at?: string | null
    updated_at?: string | null
}

export interface TratamientoInsert {
    id?: string
    nome: string
    created_at?: string | null
    updated_at?: string | null
}

export interface TratamientoUpdate {
    id?: string
    nome?: string
    created_at?: string | null
    updated_at?: string | null
}
