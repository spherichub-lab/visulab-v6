
import { supabase } from '../lib/supabase';
import { Empresa } from '../types/database.types';

export const empresasService = {
  // Listar todas as empresas (exceto deletadas)
  async getAll() {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .is('deleted_at', null)
      .order('nome');

    if (error) throw error;
    return data as Empresa[];
  },

  // Listar empresas por tipo (exceto deletadas)
  async getByType(tipo: string) {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('tipo', tipo)
      .is('deleted_at', null)
      .order('nome');

    if (error) throw error;
    return data as Empresa[];
  },

  // Buscar por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Empresa;
  },

  // Criar nova empresa
  async create(empresa: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('empresas')
      .insert([empresa])
      .select()
      .single();

    if (error) throw error;
    return data as Empresa;
  },

  // Atualizar empresa
  async update(id: string, updates: Partial<Empresa>) {
    const { data, error } = await supabase
      .from('empresas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Empresa;
  },

  // Soft Delete (Marcar como deletado)
  async delete(id: string) {
    const { error } = await supabase
      .from('empresas')
      .update({ deleted_at: new Date().toISOString(), status: 'Inactive' })
      .eq('id', id);

    if (error) throw error;
  },

  // Verificar se já existe uma Matriz cadastrada
  async hasMatriz(): Promise<boolean> {
    const { data, error } = await supabase
      .from('empresas')
      .select('id')
      .eq('tipo', 'Matriz')
      .is('deleted_at', null)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  }
};
