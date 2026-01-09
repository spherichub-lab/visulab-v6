
import { supabase } from '../lib/supabase';
import { Compra } from '../types/database.types';

export const comprasService = {
  async getAll() {
    console.log('🔍 [COMPRAS SERVICE] getAll() called - fetching all purchases');

    const { data, error } = await supabase
      .from('compras')
      .select('*')
      .order('data_compra', { ascending: false });

    if (error) {
      console.error('❌ [COMPRAS ERROR] Failed to fetch compras:', error);
      throw error;
    }

    console.log('✅ [COMPRAS SERVICE] Fetched compras:', {
      count: data?.length || 0,
      data: data
    });

    return data as Compra[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('compras')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Compra;
  },

  async create(compra: Omit<Compra, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('compras')
      .insert([compra])
      .select()
      .single();

    if (error) throw error;
    return data as Compra;
  },

  async update(id: string, updates: Partial<Compra>) {
    const { data, error } = await supabase
      .from('compras')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Compra;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('compras')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
