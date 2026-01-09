import { supabase } from '../lib/supabase';
import { Tratamento } from '../types/database.types';

export const tratamentosService = {
    async getAll() {
        const { data, error } = await supabase
            .from('tratamentos')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data as Tratamento[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('tratamentos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Tratamento;
    },

    async getAllActive() {
        return this.getAll();
    }
};
