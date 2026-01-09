
import { supabase } from '../lib/supabase';
import { Indice, Tipo, Tratamento } from '../types/database.types';

// Serviço genérico para tabelas de lookup simples
const createLookupService = <T>(tableName: string) => ({
  async getAllActive() {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('ativo', true)
      .order('nome');
    
    if (error) throw error;
    return data as T[];
  },

  async getAll() {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data as T[];
  },

  async create(item: any) {
    const { data, error } = await supabase
      .from(tableName)
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data as T;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from(tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as T;
  },

  async delete(id: string) {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
  }
});

export const indicesService = createLookupService<Indice>('indices');
export const tiposService = createLookupService<Tipo>('tipos');
export const tratamentosService = createLookupService<Tratamento>('tratamentos');
