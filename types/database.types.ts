
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Compra {
  id: string;
  fornecedor: string;
  data_compra: string;
  valor_total: number;
  status: string;
  descricao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Empresa {
  id: string;
  nome: string;
  tipo?: string;
  contato_nome?: string;
  contato_email?: string;
  status: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresa_id?: string;
  role: string;
  status: string;
  last_active?: string;
  avatar_url?: string;
  initials?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Join fields
  empresas?: Empresa;
}

// Tabelas Auxiliares (Parâmetros)
export interface Indice {
  id: string;
  nome: string;
  created_at?: string;
}

export interface Tipo {
  id: string;
  nome: string;
  created_at?: string;
}

export interface Tratamento {
  id: string;
  nome: string;
  created_at?: string;
}

// Tabela Principal
export interface Falta {
  id: string;
  usuario_id: string;
  empresa_id: string;
  tipo_id: string;
  indice_id: string;
  tratamento_id?: string;
  esf?: number;
  cil?: number;
  quantidade?: number;
  created_at?: string;
  updated_at?: string;
  // Join fields for UI
  usuarios?: Usuario;
  empresas?: Empresa;
  tipos?: Tipo;
  indices?: Indice;
  tratamentos?: Tratamento;
}
